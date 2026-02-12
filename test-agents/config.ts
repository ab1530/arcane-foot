import { TestContext, UserCredentials } from './base/types';

const demoPassword = process.env.ARCANE_DEMO_PASSWORD ?? '<DEMO_PASSWORD>';

export const testConfig: TestContext = {
  config: {
    apiBaseUrl: 'http://localhost:5001/api',
    webBaseUrl: 'http://localhost:3000',
    timeout: 30000,
    retries: 2,
    parallel: true,
    headless: true,
    screenshots: true,
    verbose: true,
  },
  users: {
    // Super Admin
    superAdmin: {
      email: 'admin@arcane.com',
      password: demoPassword,
      role: 'SUPER_ADMIN',
      tier: 'PRO',
    },
    // Scout users (different tiers)
    scoutBasic: {
      email: 'scout1@arcane.com',
      password: demoPassword,
      role: 'SCOUT',
      tier: 'GOLD',
    },
    scoutGold: {
      email: 'scout2@arcane.com',
      password: demoPassword,
      role: 'SCOUT',
      tier: 'GOLD',
    },
    scoutPro: {
      email: 'scout3@arcane.com',
      password: demoPassword,
      role: 'SCOUT',
      tier: 'PRO',
    },
    // Player
    player: {
      email: 'player176@arcane.com',  // Real player account (Arthur Leroy)
      password: demoPassword,
      role: 'PLAYER',
      tier: 'FREE',
    },
    // Coach
    coach: {
      email: 'coach@example.com',
      password: demoPassword,
      role: 'COACH',
      tier: 'PRO',
    },
    // Admin
    admin: {
      email: 'admin2@arcane.com',
      password: demoPassword,
      role: 'ADMIN',
      tier: 'PRO',
    },
  },
  accessTokens: {},
  testData: {},
};
