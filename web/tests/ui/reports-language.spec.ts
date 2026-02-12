import { test, expect } from '@playwright/test';
import { gotoAndWait, mockAuthenticatedProAccess, setLanguage, verifyTranslations } from './utils/language';

const reportsUrl = '/reports';
const autoScoutUrl = '/auto-scout';

const sampleReports = [
  {
    id: 'rpt-1',
    status: 'SUBMITTED',
    overallRating: 82,
    summary: 'Dominant midfield performance.',
    technicalRating: 85,
    physicalRating: 78,
    mentalRating: 80,
    tacticalRating: 84,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    player: {
      id: 'ply-1',
      position: 'MC',
      user: { id: 'usr-1', firstName: 'Lena', lastName: 'Dubois' },
    },
    scout: { id: 'sct-1', firstName: 'Noah', lastName: 'Martin' },
    match: {
      id: 'mtc-1',
      scheduledAt: new Date().toISOString(),
      homeClub: { name: 'Arcane FC' },
      awayClub: { name: 'Data United' },
    },
  },
];

const autoScoutTemplatesResponse = {
  success: true,
  data: [
    {
      id: 'match-performance',
      name: 'Match Performance',
      description: 'Detailed analysis of a specific match.',
      icon: 'football',
      useCase: 'Post-match review',
      estimatedCost: '$0.024',
      reportType: 'MATCH_PERFORMANCE',
    },
  ],
  count: 1,
};

const autoScoutAnalyticsResponse = {
  success: true,
  data: {
    totalReports: 1250,
    averageQualityScore: 94.3,
    estimatedCost: 42000,
    templateUsage: [
      { template: 'MATCH_PERFORMANCE', count: 800 },
      { template: 'QUICK_SCAN', count: 450 },
    ],
  },
};

async function mockReportsApi(page) {
  await page.route('**/api/scouting-reports**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: sampleReports, meta: { total: 1 } }),
    });
  });
}

async function mockAutoScoutApis(page) {
  await page.route('**/api/auto-scout/templates**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(autoScoutTemplatesResponse),
    });
  });

  await page.route('**/api/auto-scout/analytics**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(autoScoutAnalyticsResponse),
    });
  });
}

test.describe('Protected reports & AutoScout translations', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedProAccess(page);
  });

  test('Reports hero updates copy when switching languages', async ({ page }) => {
    await mockReportsApi(page);
    await verifyTranslations(page, {
      url: reportsUrl,
      selector: '[data-test="reports-hero-title"]',
      fr: 'Rapports de scouting',
      en: 'Scouting reports',
    });
  });

  test('AutoScout hero updates copy when switching languages', async ({ page }) => {
    await mockAutoScoutApis(page);
    await verifyTranslations(page, {
      url: autoScoutUrl,
      selector: '[data-test="auto-scout-hero-description"]',
      fr: 'Générez des rapports professionnels en quelques minutes grâce à l’IA Arkane.',
      en: 'Produce elite-grade scouting reports in minutes with Arkane AI.',
    });
  });

  test('Reports templates badge updates copy when switching languages', async ({ page }) => {
    await mockAutoScoutApis(page);
    await verifyTranslations(page, {
      url: `${reportsUrl}/templates`,
      selector: '[data-test="reports-templates-badge"] span',
      fr: 'Bibliothèque IA',
      en: 'AI library',
    });
  });
});
