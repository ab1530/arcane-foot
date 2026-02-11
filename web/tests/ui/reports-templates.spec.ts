import { test, expect } from '@playwright/test';
import { gotoAndWait, setLanguage } from './utils/language';

const templatesUrl = '/reports/templates';

async function mockTemplatesApi(page) {
  await page.route('**/api/auto-scout/templates**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'match-performance',
            name: 'Match Performance',
            description: 'Detailed analysis of a specific match.',
            reportType: 'MATCH_PERFORMANCE',
          },
        ],
      }),
    });
  });
}

test.describe('Reports templates CTA translations', () => {
  test('Primary CTA updates copy when switching languages', async ({ page }) => {
    await mockTemplatesApi(page);

    await setLanguage(page, 'fr');
    await gotoAndWait(page, templatesUrl);
    await expect(page.locator('[data-test="reports-templates-primary-cta"]')).toHaveText(
      'Activer ArkaneScout',
    );

    await setLanguage(page, 'en');
    await gotoAndWait(page, templatesUrl);
    await expect(page.locator('[data-test="reports-templates-primary-cta"]')).toHaveText(
      'Enable ArkaneScout',
    );
  });
});
