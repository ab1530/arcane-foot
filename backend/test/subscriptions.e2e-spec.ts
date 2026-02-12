import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * Subscription Flow E2E Test Suite
 *
 * Tests the complete subscription lifecycle:
 * 1. User starts with FREE tier (default)
 * 2. User upgrades to BASIC tier
 * 3. User upgrades to GOLD tier
 * 4. User cancels subscription
 * 5. User reactivates subscription
 *
 * @requires PostgreSQL database running
 * @requires Valid JWT_SECRET in env
 */
describe('E2E: Subscription Flow - FREE \u2192 BASIC \u2192 GOLD \u2192 Cancel', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test user
  const testEmail = `sub-test-${Date.now()}@e2e.com`;
  const testPassword = 'Test1234!';
  let userId: string;
  let accessToken: string;

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

    // Create test user with FREE subscription
    await setupTestUser();
  });

  afterAll(async () => {
    await cleanupTestUser();
    await app.close();
  });

  /**
   * Setup test user with FREE subscription
   */
  async function setupTestUser() {
    userId = randomUUID();
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create user
    await prisma.users.create({
      data: {
        id: userId,
        email: testEmail,
        passwordHash: hashedPassword,
        firstName: 'Subscription',
        lastName: 'Test',
        role: 'SCOUT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create FREE subscription (default)
    await prisma.subscriptions.create({
      data: {
        id: randomUUID(),
        userId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Login to get token
    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    accessToken = loginRes.body.accessToken;
  }

  /**
   * Cleanup test user
   */
  async function cleanupTestUser() {
    if (!prisma || !userId) return;

    try {
      await prisma.subscriptions.deleteMany({
        where: { userId },
      });
      await prisma.users.deleteMany({
        where: { id: userId },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // ===========================================
  // STEP 1: GET PRICING PLANS (PUBLIC)
  // ===========================================

  describe('Step 1: Get Pricing Plans', () => {
    it('should get all pricing plans (public endpoint)', async () => {
      const response = await request(app.getHttpServer()).get('/subscriptions/pricing').expect(200);

      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
      expect(response.body.plans.length).toBeGreaterThan(0);

      // Check plan structure
      const goldPlan = response.body.plans.find((p) => p.tier === 'GOLD');
      expect(goldPlan).toBeDefined();
      expect(goldPlan).toHaveProperty('name');
      expect(goldPlan).toHaveProperty('priceMonthly');
      expect(goldPlan).toHaveProperty('features');
    });
  });

  // ===========================================
  // STEP 2: GET CURRENT SUBSCRIPTION (FREE)
  // ===========================================

  describe('Step 2: Get Current Subscription', () => {
    it('should get user subscription (should be FREE)', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.tier).toBe('FREE');
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.userId).toBe(userId);
    });

    it('should reject request without JWT', async () => {
      await request(app.getHttpServer()).get('/subscriptions/me').expect(401);
    });
  });

  // ===========================================
  // STEP 3: UPGRADE TO BASIC TIER
  // ===========================================

  describe('Step 3: Upgrade to BASIC Tier', () => {
    it('should upgrade from FREE to BASIC', async () => {
      const response = await request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tier: SubscriptionTier.BASIC,
        })
        .expect(201);

      expect(response.body.tier).toBe('BASIC');
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.userId).toBe(userId);
    });

    it('should verify subscription is now BASIC', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.tier).toBe('BASIC');
    });
  });

  // ===========================================
  // STEP 4: UPGRADE TO GOLD TIER
  // ===========================================

  describe('Step 4: Upgrade to GOLD Tier', () => {
    it('should upgrade from BASIC to GOLD', async () => {
      const response = await request(app.getHttpServer())
        .put('/subscriptions/change-tier')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tier: SubscriptionTier.GOLD,
        })
        .expect(200);

      expect(response.body.tier).toBe('GOLD');
      expect(response.body.status).toBe('ACTIVE');
    });

    it('should verify subscription is now GOLD', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.tier).toBe('GOLD');
    });
  });

  // ===========================================
  // STEP 5: CANCEL SUBSCRIPTION
  // ===========================================

  describe('Step 5: Cancel Subscription', () => {
    it('should cancel active subscription', async () => {
      const response = await request(app.getHttpServer())
        .put('/subscriptions/cancel')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          reason: 'Testing cancellation flow',
        })
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
      expect(response.body.tier).toBe('GOLD'); // Tier remains but status changes
    });

    it('should verify subscription is cancelled', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
    });
  });

  // ===========================================
  // STEP 6: REACTIVATE SUBSCRIPTION
  // ===========================================

  describe('Step 6: Reactivate Subscription', () => {
    it('should reactivate cancelled subscription', async () => {
      const response = await request(app.getHttpServer())
        .put('/subscriptions/reactivate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.tier).toBe('GOLD');
    });

    it('should verify subscription is active again', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.tier).toBe('GOLD');
    });
  });

  // ===========================================
  // STEP 7: DOWNGRADE TO BASIC
  // ===========================================

  describe('Step 7: Downgrade to BASIC', () => {
    it('should downgrade from GOLD to BASIC', async () => {
      const response = await request(app.getHttpServer())
        .put('/subscriptions/change-tier')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tier: SubscriptionTier.BASIC,
        })
        .expect(200);

      expect(response.body.tier).toBe('BASIC');
      expect(response.body.status).toBe('ACTIVE');
    });

    it('should verify downgrade was successful', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.tier).toBe('BASIC');
    });
  });

  // ===========================================
  // EDGE CASES
  // ===========================================

  describe('Edge Cases', () => {
    it('should reject invalid subscription tier', async () => {
      await request(app.getHttpServer())
        .put('/subscriptions/change-tier')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tier: 'INVALID_TIER',
        })
        .expect(400);
    });

    it('should handle reactivating already active subscription', async () => {
      const response = await request(app.getHttpServer())
        .put('/subscriptions/reactivate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });

    it('should handle cancelling already cancelled subscription', async () => {
      // First cancel
      await request(app.getHttpServer())
        .put('/subscriptions/cancel')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          reason: 'First cancellation',
        })
        .expect(200);

      // Try to cancel again
      const response = await request(app.getHttpServer())
        .put('/subscriptions/cancel')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          reason: 'Second cancellation attempt',
        });

      // Should either succeed (idempotent) or return 400
      expect([200, 400]).toContain(response.status);
    });
  });

  // ===========================================
  // COMPLETE SUBSCRIPTION JOURNEY
  // ===========================================

  describe('Complete Subscription Journey', () => {
    it('should complete full lifecycle: FREE \u2192 BASIC \u2192 GOLD \u2192 Cancel \u2192 Reactivate', async () => {
      const uniqueEmail = `journey-${Date.now()}@e2e.com`;
      let journeyUserId: string;
      let journeyToken: string;

      try {
        // Step 1: Create user
        journeyUserId = randomUUID();
        const hashedPassword = await bcrypt.hash(testPassword, 10);

        await prisma.users.create({
          data: {
            id: journeyUserId,
            email: uniqueEmail,
            passwordHash: hashedPassword,
            firstName: 'Journey',
            lastName: 'Test',
            role: 'SCOUT',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Step 2: Create FREE subscription
        await prisma.subscriptions.create({
          data: {
            id: randomUUID(),
            userId: journeyUserId,
            tier: SubscriptionTier.FREE,
            status: SubscriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Step 3: Login
        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: uniqueEmail, password: testPassword });
        journeyToken = loginRes.body.accessToken;

        // Step 4: Verify FREE
        let subRes = await request(app.getHttpServer())
          .get('/subscriptions/me')
          .set('Authorization', `Bearer ${journeyToken}`);
        expect(subRes.body.tier).toBe('FREE');

        // Step 5: Upgrade to BASIC
        await request(app.getHttpServer())
          .post('/subscriptions')
          .set('Authorization', `Bearer ${journeyToken}`)
          .send({ tier: SubscriptionTier.BASIC })
          .expect(201);

        // Step 6: Upgrade to GOLD
        await request(app.getHttpServer())
          .put('/subscriptions/change-tier')
          .set('Authorization', `Bearer ${journeyToken}`)
          .send({ tier: SubscriptionTier.GOLD })
          .expect(200);

        // Step 7: Cancel
        await request(app.getHttpServer())
          .put('/subscriptions/cancel')
          .set('Authorization', `Bearer ${journeyToken}`)
          .send({ reason: 'Journey test' })
          .expect(200);

        subRes = await request(app.getHttpServer())
          .get('/subscriptions/me')
          .set('Authorization', `Bearer ${journeyToken}`);
        expect(subRes.body.status).toBe('CANCELLED');

        // Step 8: Reactivate
        await request(app.getHttpServer())
          .put('/subscriptions/reactivate')
          .set('Authorization', `Bearer ${journeyToken}`)
          .expect(200);

        subRes = await request(app.getHttpServer())
          .get('/subscriptions/me')
          .set('Authorization', `Bearer ${journeyToken}`);
        expect(subRes.body.status).toBe('ACTIVE');
        expect(subRes.body.tier).toBe('GOLD');

        console.log('\nComplete Subscription Journey - SUCCESS');
        console.log('User ID:', journeyUserId);
        console.log('Final Tier: GOLD, Status: ACTIVE');
      } finally {
        // Cleanup
        if (journeyUserId) {
          await prisma.subscriptions.deleteMany({ where: { userId: journeyUserId } });
          await prisma.users.deleteMany({ where: { id: journeyUserId } });
        }
      }
    });
  });

  // ===========================================
  // SUBSCRIPTION TIER VALIDATION
  // ===========================================

  describe('Subscription Tier Validation', () => {
    it('should allow all valid tier transitions', async () => {
      const tiers = [
        SubscriptionTier.FREE,
        SubscriptionTier.BASIC,
        SubscriptionTier.GOLD,
        SubscriptionTier.PRO,
        SubscriptionTier.ENTERPRISE,
      ];

      for (const tier of tiers) {
        const response = await request(app.getHttpServer())
          .put('/subscriptions/change-tier')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ tier });

        // Should succeed or return 400 for invalid transitions
        expect([200, 201, 400]).toContain(response.status);

        if (response.status === 200 || response.status === 201) {
          expect(response.body.tier).toBe(tier);
        }
      }
    });
  });
});
