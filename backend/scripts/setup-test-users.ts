/**
 * Setup Test Users Script
 *
 * Creates test users for RBAC validation testing.
 * Run this script to populate the database with test users
 * for manual or automated testing.
 *
 * Usage:
 *   npm run setup-test-users
 *   or
 *   ts-node scripts/setup-test-users.ts
 *
 * Environment:
 *   - Development: Uses local database
 *   - Staging: Set DATABASE_URL to staging database
 *   - Production: DO NOT RUN IN PRODUCTION
 */

import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tier: SubscriptionTier;
  description: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'free@test.com',
    password: 'Test1234!',
    firstName: 'Free',
    lastName: 'User',
    role: UserRole.PUBLIC,
    tier: SubscriptionTier.FREE,
    description: 'FREE tier user with PUBLIC role - No AI access, read-only',
  },
  {
    email: 'basic@test.com',
    password: 'Test1234!',
    firstName: 'Basic',
    lastName: 'User',
    role: UserRole.SCOUT,
    tier: SubscriptionTier.BASIC,
    description: 'BASIC tier user with SCOUT role - Can create reports, no AI',
  },
  {
    email: 'gold@test.com',
    password: 'Test1234!',
    firstName: 'Gold',
    lastName: 'User',
    role: UserRole.SCOUT,
    tier: SubscriptionTier.GOLD,
    description: 'GOLD tier user with SCOUT role - Full AI access, can create/edit',
  },
  {
    email: 'pro@test.com',
    password: 'Test1234!',
    firstName: 'Pro',
    lastName: 'User',
    role: UserRole.AGENT,
    tier: SubscriptionTier.PRO,
    description: 'PRO tier user with AGENT role - Advanced features, analytics',
  },
  {
    email: 'enterprise@test.com',
    password: 'Test1234!',
    firstName: 'Enterprise',
    lastName: 'User',
    role: UserRole.ADMIN,
    tier: SubscriptionTier.ENTERPRISE,
    description: 'ENTERPRISE tier user with ADMIN role - Unrestricted access',
  },
  {
    email: 'public@test.com',
    password: 'Test1234!',
    firstName: 'Public',
    lastName: 'Reader',
    role: UserRole.PUBLIC,
    tier: SubscriptionTier.FREE,
    description: 'PUBLIC role user - Cannot create/edit content',
  },
  {
    email: 'scout@test.com',
    password: 'Test1234!',
    firstName: 'Scout',
    lastName: 'Professional',
    role: UserRole.SCOUT,
    tier: SubscriptionTier.GOLD,
    description: 'SCOUT role user with GOLD tier - Standard professional access',
  },
  {
    email: 'admin@test.com',
    password: 'Test1234!',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    tier: SubscriptionTier.PRO,
    description: 'ADMIN role user - Can delete and manage all content',
  },
  {
    email: 'analyst@test.com',
    password: 'Test1234!',
    firstName: 'Analyst',
    lastName: 'User',
    role: UserRole.ANALYST,
    tier: SubscriptionTier.GOLD,
    description: 'ANALYST role user - Can analyze and create reports',
  },
  {
    email: 'agent@test.com',
    password: 'Test1234!',
    firstName: 'Agent',
    lastName: 'User',
    role: UserRole.AGENT,
    tier: SubscriptionTier.PRO,
    description: 'AGENT role user - Represents players, manages deals',
  },
];

async function setupTestUsers() {
  console.log('🚀 Setting up test users for RBAC validation...\n');

  // Safety check - prevent running in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: Cannot run setup-test-users in production!');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash('Test1234!', 10);
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const userData of TEST_USERS) {
    try {
      console.log(`📝 Processing: ${userData.email} (${userData.role} - ${userData.tier})`);

      // Check if user exists
      const existingUser = await prisma.users.findUnique({
        where: { email: userData.email },
        include: { subscriptions: true },
      });

      if (existingUser) {
        console.log(`   ⚠️  User exists, updating...`);

        // Update user
        await prisma.users.update({
          where: { id: existingUser.id },
          data: {
            role: userData.role,
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
        });

        // Update or create subscription
        if (existingUser.subscriptions) {
          await prisma.subscriptions.update({
            where: { userId: existingUser.id },
            data: {
              tier: userData.tier,
              status: SubscriptionStatus.ACTIVE,
              endDate: null,
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.subscriptions.create({
            data: {
              id: randomUUID(),
              userId: existingUser.id,
              tier: userData.tier,
              status: SubscriptionStatus.ACTIVE,
              updatedAt: new Date(),
            },
          });
        }

        updated++;
        console.log(`   ✅ Updated successfully`);
      } else {
        // Create new user
        const newUser = await prisma.users.create({
          data: {
            id: randomUUID(),
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            createdAt: new Date(),
          },
        });

        // Create subscription
        await prisma.subscriptions.create({
          data: {
            id: randomUUID(),
            userId: newUser.id,
            tier: userData.tier,
            status: SubscriptionStatus.ACTIVE,
            updatedAt: new Date(),
          },
        });

        created++;
        console.log(`   ✅ Created successfully`);
      }

      console.log(`   📋 ${userData.description}\n`);
    } catch (error) {
      failed++;
      console.error(`   ❌ Failed: ${error.message}\n`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${created}`);
  console.log(`♻️  Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${TEST_USERS.length}`);
  console.log('='.repeat(60));

  console.log('\n🔑 TEST USER CREDENTIALS:');
  console.log('='.repeat(60));
  console.log('Email                    | Password    | Role         | Tier');
  console.log('-'.repeat(60));
  TEST_USERS.forEach((user) => {
    console.log(
      `${user.email.padEnd(24)} | ${user.password.padEnd(11)} | ${user.role.padEnd(12)} | ${user.tier}`
    );
  });
  console.log('='.repeat(60));

  console.log('\n📖 QUICK START:');
  console.log('='.repeat(60));
  console.log('1. Login to get JWT token:');
  console.log('   curl -X POST http://localhost:3000/auth/login \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"email":"gold@test.com","password":"Test1234!"}\'');
  console.log('');
  console.log('2. Use token in requests:');
  console.log('   curl -X GET http://localhost:3000/auth/me \\');
  console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
  console.log('');
  console.log('3. Run E2E tests:');
  console.log('   npm run test:e2e');
  console.log('='.repeat(60));

  console.log('\n✅ Test users setup complete!\n');
}

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...\n');

  let deleted = 0;

  for (const userData of TEST_USERS) {
    try {
      const user = await prisma.users.findUnique({
        where: { email: userData.email },
      });

      if (user) {
        // Delete subscription
        await prisma.subscriptions.deleteMany({
          where: { userId: user.id },
        });

        // Delete user
        await prisma.users.delete({
          where: { id: user.id },
        });

        deleted++;
        console.log(`✅ Deleted: ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete ${userData.email}: ${error.message}`);
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deleted} test users.\n`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--cleanup')) {
    await cleanupTestUsers();
  } else if (args.includes('--help')) {
    console.log('🔧 Test Users Setup Script\n');
    console.log('Usage:');
    console.log('  npm run setup-test-users          # Create/update test users');
    console.log('  npm run setup-test-users --cleanup # Remove all test users');
    console.log('  npm run setup-test-users --help    # Show this help\n');
  } else {
    await setupTestUsers();
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
