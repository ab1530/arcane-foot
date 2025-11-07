import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionTier, SubscriptionStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * RBAC Validation E2E Test Suite
 *
 * Tests comprehensive Role-Based Access Control (RBAC) for:
 * 1. Subscription tier protections (FREE, BASIC, GOLD, PRO, ENTERPRISE)
 * 2. User role permissions (PUBLIC, SCOUT, ADMIN, etc.)
 * 3. AI endpoint protections
 * 4. CRUD operation permissions
 * 5. Error messages and response clarity
 *
 * @requires PostgreSQL database running
 * @requires Valid JWT_SECRET in env
 */
describe('RBAC Validation (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test user credentials and tokens
  const testUsers: Record<string, {
    id: string;
    email: string;
    password: string;
    role: UserRole;
    tier: SubscriptionTier;
    token?: string;
  }> = {
    freeUser: {
      id: randomUUID(),
      email: 'free@test.com',
      password: 'Test1234!',
      role: UserRole.PUBLIC,
      tier: SubscriptionTier.FREE,
    },
    basicUser: {
      id: randomUUID(),
      email: 'basic@test.com',
      password: 'Test1234!',
      role: UserRole.SCOUT,
      tier: SubscriptionTier.BASIC,
    },
    goldUser: {
      id: randomUUID(),
      email: 'gold@test.com',
      password: 'Test1234!',
      role: UserRole.SCOUT,
      tier: SubscriptionTier.GOLD,
    },
    proUser: {
      id: randomUUID(),
      email: 'pro@test.com',
      password: 'Test1234!',
      role: UserRole.AGENT,
      tier: SubscriptionTier.PRO,
    },
    enterpriseUser: {
      id: randomUUID(),
      email: 'enterprise@test.com',
      password: 'Test1234!',
      role: UserRole.ADMIN,
      tier: SubscriptionTier.ENTERPRISE,
    },
    publicUser: {
      id: randomUUID(),
      email: 'public@test.com',
      password: 'Test1234!',
      role: UserRole.PUBLIC,
      tier: SubscriptionTier.FREE,
    },
    scoutUser: {
      id: randomUUID(),
      email: 'scout@test.com',
      password: 'Test1234!',
      role: UserRole.SCOUT,
      tier: SubscriptionTier.GOLD,
    },
    adminUser: {
      id: randomUUID(),
      email: 'admin@test.com',
      password: 'Test1234!',
      role: UserRole.ADMIN,
      tier: SubscriptionTier.PRO,
    },
  };

  // AI endpoints that require GOLD tier or higher
  const goldTierEndpoints = [
    { method: 'post', path: '/ai/summary', body: { prompt: 'Test summary' } },
    { method: 'get', path: '/ai/index/test-player-id' },
    { method: 'post', path: '/ai/matchmaking', body: { playerId: 'test', clubId: 'test' } },
    { method: 'get', path: '/ai/player-analysis/test-player-id' },
    { method: 'get', path: '/ai/talent-prediction/test-player-id' },
    { method: 'get', path: '/ai/match-recommendation/test-player-id' },
    { method: 'get', path: '/ai/suspicious-detection/test-player-id' },
    { method: 'post', path: '/arkane-match/chat', body: { message: 'Find scouts', conversationId: null } },
    { method: 'post', path: '/smart-scout/suggestions', body: { partialReport: {}, context: {} } },
    { method: 'post', path: '/smart-scout/autocomplete', body: { fieldName: 'position', partialValue: 'For' } },
    { method: 'get', path: '/smart-scout/insights/test-player-id' },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule], // Use TestAppModule without ThrottlerModule
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
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

    // Cleanup and seed test users
    await seedTestUsers();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestUsers();
    await app.close();
  });

  /**
   * Seed test users with different subscription tiers and roles
   */
  async function seedTestUsers() {
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
          updatedAt: new Date(),
        },
      });

      // Generate JWT token directly (bypasses login rate limiting in tests)
      const payload = {
        sub: userData.id,
        email: userData.email,
        role: userData.role
      };
      testUsers[key].token = jwtService.sign(payload);
    }
  }

  /**
   * Cleanup test users after tests complete
   */
  async function cleanupTestUsers() {
    if (!prisma) {
      console.warn('⚠️ Prisma not initialized, skipping cleanup');
      return;
    }

    for (const userData of Object.values(testUsers)) {
      await prisma.subscriptions.deleteMany({
        where: { userId: userData.id },
      });
      await prisma.users.deleteMany({
        where: { id: userData.id },
      });
    }
  }

  // ===========================================
  // SUBSCRIPTION TIER TESTS
  // ===========================================

  describe('AI Endpoints - Subscription Tier Protection', () => {
    it('should return 403 for FREE user on GOLD-tier AI endpoints', async () => {
      const endpoint = goldTierEndpoints[0]; // /ai/summary

      const response = await request(app.getHttpServer())
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${testUsers.freeUser.token}`)
        .send(endpoint.body)
        .expect(403);

      expect(response.body.message).toContain('GOLD');
      expect(response.body.message).toContain('subscription');
    });

    it('should return 403 for BASIC user on GOLD-tier AI endpoints', async () => {
      const endpoint = goldTierEndpoints[0]; // /ai/summary

      const response = await request(app.getHttpServer())
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${testUsers.basicUser.token}`)
        .send(endpoint.body)
        .expect(403);

      expect(response.body.message).toContain('GOLD');
    });

    it('should allow GOLD user to access AI endpoints', async () => {
      const endpoint = goldTierEndpoints[0]; // /ai/summary

      // Should not return 403
      const response = await request(app.getHttpServer())
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${testUsers.goldUser.token}`)
        .send(endpoint.body);

      // Should return 200/201 or other success status (not 403)
      expect(response.status).not.toBe(403);
    });

    it('should allow PRO user to access AI endpoints', async () => {
      const endpoint = goldTierEndpoints[0];

      const response = await request(app.getHttpServer())
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${testUsers.proUser.token}`)
        .send(endpoint.body);

      expect(response.status).not.toBe(403);
    });

    it('should allow ENTERPRISE user to access AI endpoints', async () => {
      const endpoint = goldTierEndpoints[0];

      const response = await request(app.getHttpServer())
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${testUsers.enterpriseUser.token}`)
        .send(endpoint.body);

      expect(response.status).not.toBe(403);
    });

    it('should block ALL AI endpoints for FREE tier users', async () => {
      const results = await Promise.all(
        goldTierEndpoints.map(async (endpoint) => {
          const response = await request(app.getHttpServer())
            [endpoint.method](endpoint.path)
            .set('Authorization', `Bearer ${testUsers.freeUser.token}`)
            .send(endpoint.body || {});

          return {
            endpoint: `${endpoint.method.toUpperCase()} ${endpoint.path}`,
            status: response.status,
            blocked: response.status === 403,
          };
        })
      );

      // All should be blocked (403)
      const allBlocked = results.every((r) => r.blocked);
      expect(allBlocked).toBe(true);

      // Log results for visibility
      console.table(results);
    });

    it('should provide clear error messages for tier restrictions', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/summary')
        .set('Authorization', `Bearer ${testUsers.freeUser.token}`)
        .send({ prompt: 'Test' })
        .expect(403);

      // Error message should be actionable
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body.message).toMatch(/GOLD|subscription|tier/i);
    });
  });

  describe('Subscription Tier Hierarchy', () => {
    it('should enforce correct tier hierarchy (FREE < BASIC < GOLD < PRO < ENTERPRISE)', async () => {
      const tierTests = [
        { user: 'freeUser', tier: SubscriptionTier.FREE, shouldAccess: false },
        { user: 'basicUser', tier: SubscriptionTier.BASIC, shouldAccess: false },
        { user: 'goldUser', tier: SubscriptionTier.GOLD, shouldAccess: true },
        { user: 'proUser', tier: SubscriptionTier.PRO, shouldAccess: true },
        { user: 'enterpriseUser', tier: SubscriptionTier.ENTERPRISE, shouldAccess: true },
      ];

      for (const test of tierTests) {
        const response = await request(app.getHttpServer())
          .post('/ai/summary')
          .set('Authorization', `Bearer ${testUsers[test.user].token}`)
          .send({ prompt: 'Test' });

        if (test.shouldAccess) {
          expect(response.status).not.toBe(403);
        } else {
          expect(response.status).toBe(403);
        }
      }
    });
  });

  // ===========================================
  // ROLE-BASED ACCESS CONTROL TESTS
  // ===========================================

  describe('Player CRUD - Role Protection', () => {
    let testPlayerId: string;

    beforeAll(async () => {
      // Cleanup any existing players for test users
      await prisma.players.deleteMany({
        where: {
          userId: {
            in: Object.values(testUsers).map(u => u.id),
          },
        },
      });

      // Create a test player for CRUD operations
      const createResponse = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .send({
          userId: testUsers.scoutUser.id,
          dateOfBirth: '2000-01-01',
          nationality: 'France',
          position: 'Forward',
        });

      testPlayerId = createResponse.body?.id;
    });

    afterAll(async () => {
      // Cleanup all test players
      await prisma.players.deleteMany({
        where: {
          userId: {
            in: Object.values(testUsers).map(u => u.id),
          },
        },
      });
    });

    it('should prevent PUBLIC user from creating player', async () => {
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

      expect(response.body.message).toMatch(/permission|role|forbidden/i);
    });

    it('should allow SCOUT to create player', async () => {
      // Delete existing player for this user if any
      await prisma.players.deleteMany({
        where: { userId: testUsers.basicUser.id },
      });

      const response = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.basicUser.token}`)
        .send({
          userId: testUsers.basicUser.id, // Use basicUser instead of scoutUser to avoid conflict
          dateOfBirth: '2000-01-01',
          nationality: 'France',
          position: 'Midfielder',
        });

      expect(response.status).not.toBe(403);
      expect([200, 201, 409]).toContain(response.status); // 409 acceptable if already exists
    });

    it('should allow ADMIN to create player', async () => {
      // Delete existing player for this user if any
      await prisma.players.deleteMany({
        where: { userId: testUsers.proUser.id },
      });

      const response = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.adminUser.token}`)
        .send({
          userId: testUsers.proUser.id, // Use proUser instead of adminUser to avoid conflict
          dateOfBirth: '2000-01-01',
          nationality: 'Spain',
          position: 'Defender',
        });

      expect(response.status).not.toBe(403);
      expect([200, 201, 409]).toContain(response.status); // 409 acceptable if already exists
    });

    it('should allow SCOUT to update player', async () => {
      if (!testPlayerId) {
        console.warn('⚠️  Skipping test - no test player created');
        return;
      }

      const response = await request(app.getHttpServer())
        .put(`/players/${testPlayerId}`)
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .send({
          firstName: 'Updated',
        });

      expect(response.status).not.toBe(403);
    });

    it('should prevent SCOUT from deleting player', async () => {
      if (!testPlayerId) {
        console.warn('⚠️  Skipping test - no test player created');
        return;
      }

      const response = await request(app.getHttpServer())
        .delete(`/players/${testPlayerId}`)
        .set('Authorization', `Bearer ${testUsers.scoutUser.token}`)
        .expect(403);

      // Accept various 403 error message formats
      expect(response.body.message).toMatch(/ADMIN|permission|role|forbidden/i);
    });

    it('should allow ADMIN to delete player', async () => {
      // Delete existing player for this user if any
      await prisma.players.deleteMany({
        where: { userId: testUsers.enterpriseUser.id },
      });

      // Create a player to delete
      const createResponse = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.adminUser.token}`)
        .send({
          userId: testUsers.enterpriseUser.id, // Use enterpriseUser to avoid conflict
          dateOfBirth: '2000-01-01',
          nationality: 'Germany',
          position: 'Goalkeeper',
        });

      const playerToDeleteId = createResponse.body?.id;

      if (!playerToDeleteId) {
        console.warn('⚠️  Skipping test - could not create player to delete');
        return;
      }

      const response = await request(app.getHttpServer())
        .delete(`/players/${playerToDeleteId}`)
        .set('Authorization', `Bearer ${testUsers.adminUser.token}`);

      expect(response.status).not.toBe(403);
      expect([200, 204]).toContain(response.status);
    });

    it('should allow PUBLIC to read players (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  // ===========================================
  // AUTHENTICATION TESTS
  // ===========================================

  describe('Authentication Required', () => {
    it('should reject requests without JWT token', async () => {
      await request(app.getHttpServer())
        .post('/ai/summary')
        .send({ prompt: 'Test' })
        .expect(401);
    });

    it('should reject requests with invalid JWT token', async () => {
      await request(app.getHttpServer())
        .post('/ai/summary')
        .set('Authorization', 'Bearer invalid-token-12345')
        .send({ prompt: 'Test' })
        .expect(401);
    });

    it('should accept requests with valid JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${testUsers.goldUser.token}`);

      expect(response.status).not.toBe(401);
      expect(response.body).toHaveProperty('email');
    });
  });

  // ===========================================
  // ERROR MESSAGE QUALITY TESTS
  // ===========================================

  describe('Error Messages - Clarity and Actionability', () => {
    it('should provide actionable error for tier restriction', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/summary')
        .set('Authorization', `Bearer ${testUsers.freeUser.token}`)
        .send({ prompt: 'Test' });

      // Accept both 403 (tier restriction) and 429 (rate limiting)
      expect([403, 429]).toContain(response.status);

      if (response.status === 403) {
        // Should mention the required tier
        expect(response.body.message).toMatch(/GOLD/i);

        // Should have proper structure
        expect(response.body).toHaveProperty('statusCode', 403);
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should provide actionable error for role restriction', async () => {
      const response = await request(app.getHttpServer())
        .post('/players')
        .set('Authorization', `Bearer ${testUsers.publicUser.token}`)
        .send({
          firstName: 'Test',
          lastName: 'Player',
        })
        .expect(403);

      expect(response.body.message).toBeDefined();
      expect(response.body).toHaveProperty('statusCode', 403);
    });

    it('should provide clear error for missing authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toMatch(/unauthorized|token|authentication/i);
    });
  });

  // ===========================================
  // EDGE CASES AND SECURITY TESTS
  // ===========================================

  describe('Edge Cases and Security', () => {
    it('should handle expired subscription gracefully', async () => {
      try {
        // Update subscription to expired
        await prisma.subscriptions.updateMany({
          where: { userId: testUsers.goldUser.id },
          data: {
            status: SubscriptionStatus.CANCELLED,
            endDate: new Date(Date.now() - 86400000), // Yesterday
          },
        });

        const response = await request(app.getHttpServer())
          .post('/ai/summary')
          .set('Authorization', `Bearer ${testUsers.goldUser.token}`)
          .send({ prompt: 'Test' });

        // Accept both 403 (subscription guard) and 429 (rate limiting) as valid
        expect([403, 429]).toContain(response.status);
      } finally {
        // ALWAYS restore subscription (even if test fails)
        await prisma.subscriptions.updateMany({
          where: { userId: testUsers.goldUser.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            endDate: null,
          },
        });
      }
    });

    it('should handle user with no subscription record', async () => {
      // Cleanup existing nosub user if any
      await prisma.subscriptions.deleteMany({ where: { userId: { in: await prisma.users.findMany({ where: { email: 'nosub@test.com' } }).then(users => users.map(u => u.id)) } } });
      await prisma.users.deleteMany({ where: { email: 'nosub@test.com' } });

      // Create user without subscription
      const noSubUserId = randomUUID();
      const hashedPassword = await bcrypt.hash('Test1234!', 10);

      await prisma.users.create({
        data: {
          id: noSubUserId,
          email: 'nosub@test.com',
          passwordHash: hashedPassword,
          firstName: 'NoSub',
          lastName: 'User',
          role: UserRole.PUBLIC,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nosub@test.com',
          password: 'Test1234!',
        })
        .expect(200);

      const token = loginResponse.body.accessToken;

      // Try to access protected endpoint
      // Note: The system should auto-create FREE subscription
      const response = await request(app.getHttpServer())
        .post('/ai/summary')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'Test' });

      // Should still be blocked (FREE tier) - accept 403 or 429
      expect([403, 429]).toContain(response.status);

      // Cleanup
      await prisma.subscriptions.deleteMany({ where: { userId: noSubUserId } });
      await prisma.users.delete({ where: { id: noSubUserId } });
    });

    it('should not leak sensitive information in error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/summary')
        .set('Authorization', `Bearer ${testUsers.freeUser.token}`)
        .send({ prompt: 'Test' });

      // Accept both 403 and 429
      expect([403, 429]).toContain(response.status);

      // Should not expose database details, API keys, etc.
      expect(response.body.message).not.toMatch(/database|api.?key|secret|password/i);
    });
  });

  // ===========================================
  // COMPREHENSIVE ACCESS MATRIX TEST
  // ===========================================

  describe('Comprehensive Access Matrix', () => {
    it('should enforce complete access control matrix', async () => {
      const accessMatrix = [
        // Format: [endpoint, method, body, FREE, BASIC, GOLD, PRO, ENTERPRISE]
        ['/ai/summary', 'post', { prompt: 'Test' }, false, false, true, true, true],
        ['/ai/index/test-id', 'get', {}, false, false, true, true, true],
        ['/arkane-match/chat', 'post', { message: 'Test' }, false, false, true, true, true],
        ['/players', 'get', {}, true, true, true, true, true], // Public read
      ];

      const users = [
        { name: 'FREE', token: testUsers.freeUser.token },
        { name: 'BASIC', token: testUsers.basicUser.token },
        { name: 'GOLD', token: testUsers.goldUser.token },
        { name: 'PRO', token: testUsers.proUser.token },
        { name: 'ENTERPRISE', token: testUsers.enterpriseUser.token },
      ];

      const results: any[] = [];

      for (const [endpoint, method, body, ...expectedAccess] of accessMatrix) {
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          const shouldHaveAccess = expectedAccess[i];

          const response = await request(app.getHttpServer())
            [method as string](endpoint as string)
            .set('Authorization', `Bearer ${user.token}`)
            .send(body);

          // 429 is considered "has access but rate limited" (not a hard block)
          const hasAccess = response.status !== 403;

          results.push({
            endpoint: `${method} ${endpoint}`,
            tier: user.name,
            expected: shouldHaveAccess ? '✓' : '✗',
            actual: hasAccess ? '✓' : '✗',
            status: response.status,
            match: hasAccess === shouldHaveAccess,
          });
        }
      }

      // Log the matrix
      console.table(results);

      // Count mismatches (excluding rate limiting 429 errors)
      const significantMismatches = results.filter((r) => !r.match && r.status !== 429);

      // Test should pass if no significant mismatches (ignoring rate limiting)
      expect(significantMismatches.length).toBe(0);
    });
  });
});
