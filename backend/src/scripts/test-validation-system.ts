#!/usr/bin/env ts-node
import { Logger } from '@nestjs/common';
import { PrismaClient, PlayerType, VerificationStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
let adminToken = '';
let scoutToken = '';
let publicPlayerToken = '';
let testPlayerIds: string[] = [];
let testResults: { test: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

function getDemoPassword(): string {
  const demoPassword = process.env.ARCANE_DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error(
      'ARCANE_DEMO_PASSWORD is required to run this script (do not commit demo passwords).',
    );
  }
  return demoPassword;
}

// Utility functions
const log = {
  success: (msg: string) => console.log(chalk.green('✅ ' + msg)),
  error: (msg: string) => console.log(chalk.red('❌ ' + msg)),
  info: (msg: string) => console.log(chalk.blue('ℹ️  ' + msg)),
  warning: (msg: string) => console.log(chalk.yellow('⚠️  ' + msg)),
  section: (msg: string) =>
    console.log(chalk.cyan('\n' + '='.repeat(60) + '\n' + msg + '\n' + '='.repeat(60))),
};

async function apiRequest(
  method: string,
  endpoint: string,
  token?: string,
  body?: any,
): Promise<{ status: number; data: any }> {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { error: error.message } };
  }
}

async function runTest(testName: string, testFn: () => Promise<boolean>) {
  try {
    const result = await testFn();
    testResults.push({ test: testName, status: result ? 'PASS' : 'FAIL' });
    if (result) {
      log.success(testName);
    } else {
      log.error(testName);
    }
    return result;
  } catch (error) {
    testResults.push({ test: testName, status: 'FAIL', details: error.message });
    log.error(`${testName}: ${error.message}`);
    return false;
  }
}

// Test Suite
async function testValidationSystem() {
  log.section('🧪 ARCANE FOOTBALL - Player Validation System Test Suite');

  // 1. Setup and Authentication Tests
  log.section('1. Setup & Authentication Tests');

  await runTest('Server health check', async () => {
    const { status } = await apiRequest('GET', '/api/health');
    return status === 200;
  });

  await runTest('Admin authentication', async () => {
    const { status, data } = await apiRequest('POST', '/api/auth/login', null, {
      email: 'admin@arcane.com',
      password: getDemoPassword(),
    });
    if (status === 200 && data.accessToken) {
      adminToken = data.accessToken;
      return true;
    }
    return false;
  });

  await runTest('Scout authentication', async () => {
    const { status, data } = await apiRequest('POST', '/api/auth/login', null, {
      email: 'scout1@arcane.com',
      password: getDemoPassword(),
    });
    if (status === 200 && data.accessToken) {
      scoutToken = data.accessToken;
      return true;
    }
    return false;
  });

  await runTest('PUBLIC player authentication', async () => {
    const { status, data } = await apiRequest('POST', '/api/auth/login', null, {
      email: 'lucas.dubois@test.com',
      password: 'TestPlayer123!',
    });
    if (status === 200 && data.accessToken) {
      publicPlayerToken = data.accessToken;
      return true;
    }
    return false;
  });

  // 2. Create Test Data
  log.section('2. Test Data Creation');

  await runTest('Create additional PUBLIC players', async () => {
    const hashedPassword = await bcrypt.hash('TestPlayer123!', 10);
    const testPlayers = [
      {
        email: 'test.validation1@test.com',
        firstName: 'Test',
        lastName: 'Validation1',
        position: 'Midfielder',
      },
      {
        email: 'test.validation2@test.com',
        firstName: 'Test',
        lastName: 'Validation2',
        position: 'Forward',
      },
      {
        email: 'test.suspicious@test.com',
        firstName: 'Fake',
        lastName: 'Profile',
        position: 'Defender',
      },
    ];

    for (const player of testPlayers) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.users.create({
            data: {
              id: randomUUID(),
              email: player.email,
              passwordHash: hashedPassword,
              firstName: player.firstName,
              lastName: player.lastName,
              role: UserRole.PUBLIC,
              updatedAt: new Date(),
            },
          });

          const createdPlayer = await tx.players.create({
            data: {
              id: randomUUID(),
              users: {
                connect: { id: user.id },
              },
              playerType: PlayerType.PUBLIC,
              verificationStatus: VerificationStatus.PENDING,
              position: player.position,
              dateOfBirth: new Date('2005-01-01'),
              nationality: 'FR',
              isPublic: true,
              updatedAt: new Date(),
            },
          });

          testPlayerIds.push(createdPlayer.id);
          return createdPlayer;
        });
      } catch (error) {
        // Player might already exist
      }
    }
    return testPlayerIds.length > 0;
  });

  // 3. Validation Endpoints Tests
  log.section('3. Player Validation Endpoints');

  await runTest('GET pending validation players (Admin)', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/admin/players/pending-validation',
      adminToken,
    );
    return status === 200 && data?.data?.length > 0;
  });

  await runTest('GET pending validation players (Scout)', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/admin/players/pending-validation',
      scoutToken,
    );
    return status === 200 && data?.data?.length > 0;
  });

  await runTest('GET pending validation players (Unauthorized)', async () => {
    const { status } = await apiRequest(
      'GET',
      '/admin/players/pending-validation',
      publicPlayerToken,
    );
    return status === 403 || status === 401;
  });

  await runTest('Validate player (Admin)', async () => {
    if (testPlayerIds.length === 0) return false;
    const { status, data } = await apiRequest(
      'POST',
      `/admin/players/${testPlayerIds[0]}/validate`,
      adminToken,
    );
    return status === 200 && data?.verificationStatus === 'VERIFIED';
  });

  await runTest('Check validated player status', async () => {
    if (testPlayerIds.length === 0) return false;
    const player = await prisma.players.findUnique({
      where: { id: testPlayerIds[0] },
    });
    return player?.verificationStatus === VerificationStatus.VERIFIED;
  });

  // 4. Rejection Tests
  log.section('4. Player Rejection Tests');

  await runTest('Reject player with reason (Scout)', async () => {
    if (testPlayerIds.length < 2) return false;
    const { status, data } = await apiRequest(
      'POST',
      `/admin/players/${testPlayerIds[1]}/reject`,
      scoutToken,
      {
        rejectionReason: 'Incomplete profile information',
      },
    );
    return status === 200 && data?.verificationStatus === 'REJECTED';
  });

  await runTest('Check rejected player has reason', async () => {
    if (testPlayerIds.length < 2) return false;
    const player = await prisma.players.findUnique({
      where: { id: testPlayerIds[1] },
    });
    return (
      player?.verificationStatus === VerificationStatus.REJECTED &&
      player?.rejectionReason === 'Incomplete profile information'
    );
  });

  await runTest('Mark player as suspicious', async () => {
    if (testPlayerIds.length < 3) return false;
    const { status, data } = await apiRequest(
      'POST',
      `/admin/players/${testPlayerIds[2]}/mark-suspicious`,
      adminToken,
      {
        rejectionReason: 'Suspected fake profile',
      },
    );
    return status === 200 && data?.verificationStatus === 'SUSPICIOUS';
  });

  // 5. Conversion Tests
  log.section('5. PUBLIC to AGENCY Conversion');

  await runTest('Convert PUBLIC to AGENCY (Admin only)', async () => {
    if (testPlayerIds.length === 0) return false;
    const { status, data } = await apiRequest(
      'POST',
      `/admin/players/${testPlayerIds[0]}/convert-to-agency`,
      adminToken,
      {
        conversionNotes: 'Excellent talent, ready for professional development',
      },
    );
    return status === 200 && data?.playerType === 'AGENCY';
  });

  await runTest('Verify user role updated to PLAYER', async () => {
    if (testPlayerIds.length === 0) return false;
    const player = await prisma.players.findUnique({
      where: { id: testPlayerIds[0] },
      include: { users: true },
    });
    return player?.users?.role === UserRole.PLAYER;
  });

  await runTest('Scout cannot convert to AGENCY', async () => {
    // Create a new PUBLIC player for this test
    const newPlayer = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          id: randomUUID(),
          email: 'test.convert@test.com',
          passwordHash: await bcrypt.hash('Test123!', 10),
          firstName: 'Convert',
          lastName: 'Test',
          role: UserRole.PUBLIC,
          updatedAt: new Date(),
        },
      });

      return await tx.players.create({
        data: {
          id: randomUUID(),
          users: {
            connect: { id: user.id },
          },
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.VERIFIED,
          position: 'Goalkeeper',
          dateOfBirth: new Date('2004-01-01'),
          nationality: 'FR',
          updatedAt: new Date(),
        },
      });
    });

    const { status } = await apiRequest(
      'POST',
      `/admin/players/${newPlayer.id}/convert-to-agency`,
      scoutToken,
    );
    return status === 403;
  });

  // 6. Statistics Tests
  log.section('6. Verification Statistics');

  await runTest('Get verification statistics', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/admin/players/verification-stats',
      adminToken,
    );
    return (
      status === 200 &&
      data?.total !== undefined &&
      data?.pending !== undefined &&
      data?.verified !== undefined
    );
  });

  await runTest('Get players by status (VERIFIED)', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/admin/players/by-status/VERIFIED',
      adminToken,
    );
    return status === 200 && Array.isArray(data?.data);
  });

  await runTest('Get players by status (REJECTED)', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/admin/players/by-status/REJECTED',
      adminToken,
    );
    return status === 200 && Array.isArray(data?.data);
  });

  // 7. Bulk Import Tests
  log.section('7. Bulk Import Tests');

  await runTest('Bulk import JSON (Admin)', async () => {
    const bulkData = {
      players: [
        {
          email: 'bulk1@test.com',
          firstName: 'Bulk',
          lastName: 'Player1',
          position: 'Midfielder',
          dateOfBirth: '2005-06-15',
          nationality: 'FR',
        },
        {
          email: 'bulk2@test.com',
          firstName: 'Bulk',
          lastName: 'Player2',
          position: 'Forward',
          dateOfBirth: '2004-03-22',
          nationality: 'ES',
        },
      ],
      autoVerify: true,
    };

    const { status, data } = await apiRequest(
      'POST',
      '/admin/players/bulk-import',
      adminToken,
      bulkData,
    );
    return status === 200 && data?.imported > 0;
  });

  await runTest('Export players to CSV', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/admin/players/export-csv?status=VERIFIED',
      adminToken,
    );
    return status === 200 && typeof data === 'string' && data.includes('firstName,lastName');
  });

  // 8. Validation History Tests
  log.section('8. Validation History');

  await runTest('Get player validation history', async () => {
    if (testPlayerIds.length === 0) return false;
    const { status, data } = await apiRequest(
      'GET',
      `/admin/players/${testPlayerIds[0]}/validation-history`,
      adminToken,
    );
    return status === 200 && Array.isArray(data);
  });

  // 9. Edge Cases & Error Handling
  log.section('9. Edge Cases & Error Handling');

  await runTest('Validate non-existent player', async () => {
    const { status } = await apiRequest(
      'POST',
      '/admin/players/non-existent-id/validate',
      adminToken,
    );
    return status === 404;
  });

  await runTest('Reject without reason', async () => {
    // Create a new player for this test
    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: 'test.noreject@test.com',
        firstName: 'No',
        lastName: 'Reject',
        role: UserRole.PUBLIC,
        updatedAt: new Date(),
      },
    });

    const newPlayer = await prisma.players.create({
      data: {
        id: randomUUID(),
        users: {
          connect: { id: user.id },
        },
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.PENDING,
        position: 'Defender',
        dateOfBirth: new Date('2005-01-01'),
        nationality: 'FR',
        updatedAt: new Date(),
      },
    });

    const { status } = await apiRequest(
      'POST',
      `/admin/players/${newPlayer.id}/reject`,
      adminToken,
      {},
    );
    return status === 400;
  });

  await runTest('Convert already AGENCY player', async () => {
    // Find an AGENCY player
    const agencyPlayer = await prisma.players.findFirst({
      where: { playerType: PlayerType.AGENCY },
    });
    if (!agencyPlayer) return false;

    const { status } = await apiRequest(
      'POST',
      `/admin/players/${agencyPlayer.id}/convert-to-agency`,
      adminToken,
    );
    return status === 400;
  });

  await runTest('Bulk import with invalid data', async () => {
    const { status } = await apiRequest('POST', '/admin/players/bulk-import', adminToken, {
      players: [
        {
          email: 'invalid-email',
          firstName: '',
          position: 'InvalidPosition',
        },
      ],
    });
    return status === 400;
  });

  // 10. Performance Tests
  log.section('10. Performance Tests');

  await runTest('Get pending players with pagination', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/admin/players/pending-validation?page=1&limit=10',
      adminToken,
    );
    return status === 200 && data?.meta?.limit === 10;
  });

  await runTest('Search pending players', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/admin/players/pending-validation?search=Test',
      adminToken,
    );
    return status === 200 && Array.isArray(data?.data);
  });

  // Test Summary
  log.section('📊 TEST RESULTS SUMMARY');

  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;
  const total = testResults.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n${chalk.bold('Total Tests:')} ${total}`);
  console.log(`${chalk.green('Passed:')} ${passed}`);
  console.log(`${chalk.red('Failed:')} ${failed}`);
  console.log(`${chalk.blue('Pass Rate:')} ${passRate}%`);

  if (failed > 0) {
    console.log(chalk.red('\n❌ Failed Tests:'));
    testResults
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  - ${r.test}${r.details ? `: ${r.details}` : ''}`);
      });
  }

  // Cleanup test data
  log.section('🧹 Cleanup');
  await runTest('Cleanup test data', async () => {
    try {
      // Delete test players and users
      const testEmails = [
        'test.validation1@test.com',
        'test.validation2@test.com',
        'test.suspicious@test.com',
        'test.convert@test.com',
        'test.noreject@test.com',
        'bulk1@test.com',
        'bulk2@test.com',
      ];

      for (const email of testEmails) {
        const user = await prisma.users.findUnique({ where: { email } });
        if (user) {
          await prisma.players.deleteMany({ where: { userId: user.id } });
          await prisma.users.delete({ where: { id: user.id } });
        }
      }
      return true;
    } catch (error) {
      log.warning('Some test data could not be cleaned up');
      return false;
    }
  });

  return passRate;
}

// Main execution
async function main() {
  try {
    log.info('Starting validation system test suite...');
    log.info('Make sure the server is running on http://localhost:3000\n');

    const passRate = await testValidationSystem();

    if (parseFloat(passRate) >= 80) {
      log.success(`\n✅ Test suite completed successfully! (${passRate}% pass rate)`);
      process.exit(0);
    } else {
      log.error(`\n❌ Test suite failed. Pass rate: ${passRate}%`);
      process.exit(1);
    }
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main();
