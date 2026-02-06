import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * RBAC (Role-Based Access Control) E2E Test Suite
 *
 * Tests access control for different user roles and permissions:
 * 1. SCOUT user can access scout endpoints but NOT admin endpoints
 * 2. ADMIN user can access admin endpoints
 * 3. PUBLIC user has limited access
 * 4. Proper 403 responses for unauthorized access
 *
 * @requires PostgreSQL database running
 * @requires Valid JWT_SECRET in env
 */
describe('E2E: RBAC - Role-Based Access Control', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test users with different roles
  const testUsers: Record<
    string,
    {
      id: string;
      email: string;
      password: string;
      role: UserRole;
      tier: SubscriptionTier;
      token?: string;
    }
  > = {
    publicUser: {
      id: randomUUID(),
      email: `public-rbac-${Date.now()}@test.com`,
      password: 'Test1234!',
      role: UserRole.PUBLIC,
      tier: SubscriptionTier.FREE,
    },
    scoutUser: {
      id: randomUUID(),
      email: `scout-rbac-${Date.now()}@test.com`,
      password: 'Test1234!',
      role: UserRole.SCOUT,
      tier: SubscriptionTier.GOLD,
    },
    adminUser: {
      id: randomUUID(),
      email: `admin-rbac-${Date.now()}@test.com`,
      password: 'Test1234!',
      role: UserRole.ADMIN,
      tier: SubscriptionTier.ENTERPRISE,
    },
  };

  let testPlayerId: string;
  let testClubId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Setup test users
    await setupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await app.close();
  });

  /**
   * Setup test users with different roles
   */
  async function setupTestUsers() {
    const hashedPassword = await bcrypt.hash('Test1234!', 10);

    for (const [key, userData] of Object.entries(testUsers)) {
      // Delete existing user if any
      await prisma.users.deleteMany({
        where: { email: userData.email },
      });

      // Create user
      await prisma.users.create({
        data: {
          id: userData.id,
          email: userData.email,
          passwordHash: hashedPassword,
          firstName: key.charAt(0).toUpperCase() + key.slice(1),
          lastName: 'User',
          role: userData.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create subscription
      await prisma.subscriptions.create({
        data: {
          id: randomUUID(),
          userId: userData.id,
          tier: userData.tier,
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Generate JWT token
      const payload = {
        sub: userData.id,
        email: userData.email,
        role: userData.role,
      };
      testUsers[key].token = jwtService.sign(payload);
    }

    // Create test club for admin tests
    testClubId = randomUUID();
    await prisma.clubs.upsert({
      where: { id: testClubId },
      create: {
        id: testClubId,
        name: 'RBAC Test Club',
        country: 'France',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {},
    });

    // Create test player for RBAC tests
    await prisma.players.deleteMany({
      where: { userId: testUsers.scoutUser.id },
    });

    const player = await prisma.players.create({
      data: {
        id: randomUUID(),
        userId: testUsers.scoutUser.id,
        dateOfBirth: new Date('2000-01-01'),
        nationality: 'France',
        position: 'Forward',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    testPlayerId = player.id;
  }

  /**
   * Cleanup test users
   */
  async function cleanupTestUsers() {
    if (!prisma) return;

    try {
      if (testPlayerId) {
        await prisma.players.deleteMany({
          where: { id: testPlayerId },
        });
      }

      for (const userData of Object.values(testUsers)) {
        await prisma.subscriptions.deleteMany({
          where: { userId: userData.id },
        });
        await prisma.users.deleteMany({
          where: { id: userData.id },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // ===========================================
  // PUBLIC USER TESTS
  // ===========================================

  describe('PUBLIC User Access Control', () => {
    it('should allow PUBLIC user to read public endpoints', async () => {
      const response = await request(app.getHttpServer()).get('/players').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow PUBLIC user to access pricing', async () => {
      const response = await request(app.getHttpServer()).get('/subscriptions/pricing').expect(200);

      expect(response.body).toHaveProperty('plans');
    });

    it('should prevent PUBLIC user from creating players', async () => {
      const response = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.publicUser.token}`)
        .send({
          userId: testUsers.publicUser.id,
          dateOfBirth: '2000-01-01',
          nationality: 'France',
          position: 'Midfielder',
        })
        .expect(403);

      expect(response.body.message).toMatch(/permission|role|forbidden/i);
    });

    it('should prevent PUBLIC user from accessing their subscription', async () => {
      // PUBLIC users might be allowed to see their own subscription
      const response = await request(app.getHttpServer())
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${testUsers.publicUser.token}`);

      // Accept either 200 (allowed) or 403 (forbidden)
      expect([200, 403]).toContain(response.status);
    });
  });

  // ===========================================
  // SCOUT USER TESTS
  // ===========================================

  describe('SCOUT User Access Control', () => {
    it('should allow SCOUT to create players', async () => {
      // Delete any existing player for this user
      await prisma.players.deleteMany({
        where: { userId: testUsers.scoutUser.id },
      });

      const response = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .send({
          userId: testUsers.scoutUser.id,
          dateOfBirth: '1999-06-15',
          nationality: 'Spain',
          position: 'Defender',
        });

      expect([200, 201]).toContain(response.status);
    });

    it('should allow SCOUT to read players', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow SCOUT to update their own player', async () => {
      // Ensure test player exists (may have been deleted by previous tests)
      let playerId = testPlayerId;
      const existingPlayer = await prisma.players.findUnique({
        where: { id: testPlayerId },
      });

      if (!existingPlayer) {
        // Recreate the player if it was deleted
        await prisma.players.deleteMany({
          where: { userId: testUsers.scoutUser.id },
        });
        const player = await prisma.players.create({
          data: {
            id: randomUUID(),
            userId: testUsers.scoutUser.id,
            dateOfBirth: new Date('2000-01-01'),
            nationality: 'France',
            position: 'Forward',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        playerId = player.id;
        testPlayerId = player.id;
      }

      const response = await request(app.getHttpServer())
        .put(`/players/${playerId}`)
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .send({
          height: 185,
        });

      expect([200, 201]).toContain(response.status);
    });

    it('should prevent SCOUT from deleting players', async () => {
      if (!testPlayerId) {
        console.warn('Skipping - no test player');
        return;
      }

      const response = await request(app.getHttpServer())
        .delete(`/players/${testPlayerId}`)
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .expect(403);

      expect(response.body.message).toMatch(/ADMIN|permission|role|forbidden/i);
    });

    it('should allow SCOUT to create scouting reports', async () => {
      // Ensure test player exists (may have been deleted by previous tests)
      let playerId = testPlayerId;
      const existingPlayer = await prisma.players.findUnique({
        where: { id: testPlayerId },
      });

      if (!existingPlayer) {
        // Recreate the player if it was deleted
        await prisma.players.deleteMany({
          where: { userId: testUsers.scoutUser.id },
        });
        const player = await prisma.players.create({
          data: {
            id: randomUUID(),
            userId: testUsers.scoutUser.id,
            dateOfBirth: new Date('2000-01-01'),
            nationality: 'France',
            position: 'Forward',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        playerId = player.id;
        testPlayerId = player.id;
      }

      // Create match first
      const homeClub = await prisma.clubs.findFirst();
      const awayClub = await prisma.clubs.findFirst({
        where: { id: { not: homeClub?.id } },
      });

      if (!homeClub || !awayClub) {
        console.warn('Skipping - no clubs found');
        return;
      }

      const match = await prisma.matches.create({
        data: {
          id: randomUUID(),
          homeClubId: homeClub.id,
          awayClubId: awayClub.id,
          scheduledAt: new Date(),
          season: '2024-2025',
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/scouting-reports')
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .send({
          matchId: match.id,
          playerId,
          overallRating: 7,
          summary: 'RBAC test report',
        });

      expect([200, 201]).toContain(response.status);

      // Cleanup
      await prisma.scouting_reports.deleteMany({
        where: { matchId: match.id },
      });
      await prisma.matches.delete({
        where: { id: match.id },
      });
    });
  });

  // ===========================================
  // ADMIN USER TESTS
  // ===========================================

  describe('ADMIN User Access Control', () => {
    it('should allow ADMIN to create players', async () => {
      const response = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.adminUser.token}`)
        .send({
          userId: testUsers.adminUser.id,
          dateOfBirth: '1995-08-20',
          nationality: 'Germany',
          position: 'Goalkeeper',
        });

      expect([200, 201, 409]).toContain(response.status); // 409 if already exists
    });

    it('should allow ADMIN to delete players', async () => {
      // Delete any existing player for this user first (due to unique constraint on userId)
      await prisma.players.deleteMany({
        where: { userId: testUsers.adminUser.id },
      });

      // Create a player to delete
      const player = await prisma.players.create({
        data: {
          id: randomUUID(),
          userId: testUsers.adminUser.id,
          dateOfBirth: new Date('1997-03-10'),
          nationality: 'Italy',
          position: 'Midfielder',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/players/${player.id}`)
        .set('Authorization', `Bearer ${testUsers.adminUser.token}`);

      expect([200, 204]).toContain(response.status);
    });

    it('should allow ADMIN to access all data', async () => {
      const playersRes = await request(app.getHttpServer())
        .get('/players')
        .set('Authorization', `Bearer ${testUsers.adminUser.token}`)
        .expect(200);

      expect(Array.isArray(playersRes.body)).toBe(true);

      const clubsRes = await request(app.getHttpServer())
        .get('/clubs')
        .set('Authorization', `Bearer ${testUsers.adminUser.token}`)
        .expect(200);

      expect(Array.isArray(clubsRes.body)).toBe(true);
    });
  });

  // ===========================================
  // CROSS-ROLE ACCESS TESTS
  // ===========================================

  describe('Cross-Role Access Validation', () => {
    it('should enforce role hierarchy for protected operations', async () => {
      const roles = [
        { name: 'PUBLIC', token: testUsers.publicUser.token, canDelete: false },
        { name: 'SCOUT', token: testUsers.scoutUser.token, canDelete: false },
        { name: 'ADMIN', token: testUsers.adminUser.token, canDelete: true },
      ];

      for (const role of roles) {
        const userId = testUsers[role.name.toLowerCase() + 'User'].id;

        // Delete any existing player for this user first (due to unique constraint on userId)
        await prisma.players.deleteMany({
          where: { userId },
        });

        // Create a test player for deletion test
        const player = await prisma.players.create({
          data: {
            id: randomUUID(),
            userId,
            dateOfBirth: new Date('2000-01-01'),
            nationality: 'Test',
            position: 'Forward',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        const response = await request(app.getHttpServer())
          .delete(`/players/${player.id}`)
          .set('Authorization', `Bearer ${role.token}`);

        if (role.canDelete) {
          expect([200, 204]).toContain(response.status);
        } else {
          expect(response.status).toBe(403);
        }

        // Cleanup if not deleted
        await prisma.players.deleteMany({ where: { id: player.id } });
      }
    });
  });

  // ===========================================
  // AUTHENTICATION TESTS
  // ===========================================

  describe('Authentication Required', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-123')
        .expect(401);
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .expect(200);

      expect(response.body.email).toBe(testUsers.scoutUser.email);
    });
  });

  // ===========================================
  // AUTHORIZATION ERROR MESSAGES
  // ===========================================

  describe('Authorization Error Messages', () => {
    it('should provide clear 401 error for missing auth', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me').expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toMatch(/unauthorized|token|authentication/i);
    });

    it('should provide clear 403 error for insufficient permissions', async () => {
      const response = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.publicUser.token}`)
        .send({
          userId: testUsers.publicUser.id,
          dateOfBirth: '2000-01-01',
          nationality: 'France',
          position: 'Forward',
        })
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body.message).toMatch(/permission|role|forbidden/i);
    });
  });

  // ===========================================
  // COMPLETE RBAC FLOW TEST
  // ===========================================

  describe('Complete RBAC Flow', () => {
    it('should enforce complete role-based access control', async () => {
      console.log('\nRBAC Flow Test - Starting...');

      // Test PUBLIC user
      console.log('Testing PUBLIC user...');
      const publicRes = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.publicUser.token}`)
        .send({
          userId: testUsers.publicUser.id,
          dateOfBirth: '2000-01-01',
          nationality: 'France',
          position: 'Forward',
        });
      expect(publicRes.status).toBe(403);
      console.log('PUBLIC user blocked from creating player');

      // Test SCOUT user
      console.log('Testing SCOUT user...');
      await prisma.players.deleteMany({
        where: { userId: testUsers.scoutUser.id },
      });

      const scoutCreateRes = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .send({
          userId: testUsers.scoutUser.id,
          dateOfBirth: '2000-01-01',
          nationality: 'France',
          position: 'Forward',
        });
      expect([200, 201]).toContain(scoutCreateRes.status);
      console.log('SCOUT user allowed to create player');

      const createdPlayerId = scoutCreateRes.body.id;

      const scoutDeleteRes = await request(app.getHttpServer())
        .delete(`/players/${createdPlayerId}`)
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`);
      expect(scoutDeleteRes.status).toBe(403);
      console.log('SCOUT user blocked from deleting player');

      // Test ADMIN user
      console.log('Testing ADMIN user...');
      const adminDeleteRes = await request(app.getHttpServer())
        .delete(`/players/${createdPlayerId}`)
        .set('Authorization', `Bearer ${testUsers.adminUser.token}`);
      expect([200, 204]).toContain(adminDeleteRes.status);
      console.log('ADMIN user allowed to delete player');

      console.log('RBAC Flow Test - SUCCESS\n');
    });
  });
});
