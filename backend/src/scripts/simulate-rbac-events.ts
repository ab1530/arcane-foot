import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Simulate RBAC events for testing the monitoring dashboard
 *
 * This script generates realistic test data including:
 * - 403 blocking events
 * - Upgrade modal interactions
 * - Subscription conversions
 *
 * Usage:
 *   npx ts-node src/scripts/simulate-rbac-events.ts
 */

const FEATURES = [
  'AI Analysis',
  'ArkaneMatch Chat',
  'AutoScout',
  'Market Value AI',
  'Performance Predictor',
  'Playstyle DNA',
  'SmartScout AI',
  'Voice to Report',
  'Marketplace',
  'Camps & Detection',
];

const ENDPOINTS = [
  '/ai/analyze',
  '/arkane-match/chat',
  '/auto-scout/generate',
  '/market-value/estimate',
  '/performance-predictor/predict',
  '/playstyle-dna/analyze',
  '/smart-scout/search',
  '/voice-to-report/transcribe',
  '/marketplace/listings',
  '/camps/register',
];

const TIERS = ['FREE', 'BASIC', 'PRO', 'GOLD', 'ENTERPRISE'];

async function simulateRbacEvents() {
  console.log('Starting RBAC event simulation...\n');

  // Get test users
  const users = await prisma.users.findMany({
    take: 20,
    include: {
      subscriptions: true,
    },
  });

  if (users.length === 0) {
    console.error('No users found. Please seed the database first.');
    return;
  }

  console.log(`Found ${users.length} users for simulation\n`);

  const stats = {
    blockedEvents: 0,
    modalsShown: 0,
    modalsDismissed: 0,
    modalsCTAClicked: 0,
    conversions: 0,
    totalRevenue: 0,
  };

  // Simulate events over the last 7 days
  const daysToSimulate = 7;
  const now = new Date();

  for (let day = 0; day < daysToSimulate; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    console.log(`Simulating day ${day + 1}/${daysToSimulate} (${date.toLocaleDateString()})...`);

    // Simulate 10-50 events per day
    const eventsPerDay = Math.floor(Math.random() * 40) + 10;

    for (let i = 0; i < eventsPerDay; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const currentTier = user.subscriptions?.tier || 'FREE';
      const feature = FEATURES[Math.floor(Math.random() * FEATURES.length)];
      const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];

      // Higher tiers get blocked less
      const requiredTierIndex = Math.min(
        Math.floor(Math.random() * 3) + 1, // Usually require BASIC, PRO, or GOLD
        TIERS.length - 1,
      );
      const requiredTier = TIERS[requiredTierIndex];

      // Create a timestamp within this day
      const eventTime = new Date(date);
      eventTime.setHours(Math.floor(Math.random() * 24));
      eventTime.setMinutes(Math.floor(Math.random() * 60));

      // 1. Create blocked event
      await prisma.rbac_events.create({
        data: {
          id: `rbac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          eventType: 'FEATURE_BLOCKED',
          feature,
          endpoint,
          method: 'GET',
          currentTier,
          requiredTier,
          userJourney: JSON.stringify([
            { path: '/dashboard', timestamp: new Date() },
            { path: '/players', timestamp: new Date() },
            { path: endpoint, timestamp: new Date() },
          ]),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Test Simulation)',
          timestamp: eventTime,
        },
      });
      stats.blockedEvents++;

      // 2. 80% chance user sees modal
      if (Math.random() < 0.8) {
        const modalTime = new Date(eventTime);
        modalTime.setSeconds(modalTime.getSeconds() + 2);

        const modalId = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.upgrade_modals.create({
          data: {
            id: modalId,
            userId: user.id,
            feature,
            trigger: '403_error',
            shownAt: modalTime,
          },
        });
        stats.modalsShown++;

        // 3. 85% chance user dismisses modal
        if (Math.random() < 0.85) {
          const dismissTime = new Date(modalTime);
          dismissTime.setSeconds(dismissTime.getSeconds() + Math.floor(Math.random() * 30) + 5);

          await prisma.upgrade_modals.update({
            where: { id: modalId },
            data: {
              dismissedAt: dismissTime,
              timeShownSeconds: Math.floor((dismissTime.getTime() - modalTime.getTime()) / 1000),
            },
          });
          stats.modalsDismissed++;
        } else {
          // 15% chance user clicks CTA
          const ctaTime = new Date(modalTime);
          ctaTime.setSeconds(ctaTime.getSeconds() + Math.floor(Math.random() * 15) + 3);

          await prisma.upgrade_modals.update({
            where: { id: modalId },
            data: {
              ctaClickedAt: ctaTime,
            },
          });
          stats.modalsCTAClicked++;

          // 50% of CTA clicks result in conversion
          if (Math.random() < 0.5 && currentTier !== 'GOLD' && currentTier !== 'ENTERPRISE') {
            const conversionTime = new Date(ctaTime);
            conversionTime.setMinutes(
              conversionTime.getMinutes() + Math.floor(Math.random() * 30) + 5,
            );

            // Most users upgrade to GOLD
            const toTier = Math.random() < 0.7 ? 'GOLD' : 'PRO';

            const tierPricing = {
              FREE: 0,
              BASIC: 19.99,
              PRO: 39.99,
              GOLD: 49.99,
              ENTERPRISE: 99.99,
            };

            const revenue = tierPricing[toTier];

            await prisma.subscription_conversions.create({
              data: {
                id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: user.id,
                fromTier: currentTier,
                toTier,
                source: 'ai_features_403',
                feature,
                revenue,
                currency: 'EUR',
                convertedAt: conversionTime,
              },
            });

            stats.conversions++;
            stats.totalRevenue += revenue;
          }
        }
      }

      // Small delay to ensure unique timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  console.log('\n=== SIMULATION COMPLETE ===');
  console.log(`Blocked Events: ${stats.blockedEvents}`);
  console.log(`Modals Shown: ${stats.modalsShown}`);
  console.log(`Modals Dismissed: ${stats.modalsDismissed}`);
  console.log(`Modals CTA Clicked: ${stats.modalsCTAClicked}`);
  console.log(`Conversions: ${stats.conversions}`);
  console.log(`Total Revenue: €${stats.totalRevenue.toFixed(2)}`);
  console.log(`Conversion Rate: ${((stats.conversions / stats.blockedEvents) * 100).toFixed(2)}%`);
  console.log(`Modal CTR: ${((stats.modalsCTAClicked / stats.modalsShown) * 100).toFixed(2)}%`);
  console.log('===========================\n');

  console.log('Test data created successfully!');
  console.log('You can now view the dashboard at: GET /analytics/rbac-metrics?days=7');
}

async function clearTestData() {
  console.log('Clearing existing RBAC test data...');

  await prisma.subscription_conversions.deleteMany({});
  await prisma.upgrade_modals.deleteMany({});
  await prisma.rbac_events.deleteMany({});

  console.log('Test data cleared.\n');
}

async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.includes('--clear')) {
      await clearTestData();
      return;
    }

    if (args.includes('--clear-and-simulate')) {
      await clearTestData();
    }

    await simulateRbacEvents();
  } catch (error) {
    console.error('Error during simulation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
