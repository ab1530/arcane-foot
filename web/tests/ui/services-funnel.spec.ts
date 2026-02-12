import { test, expect } from '@playwright/test';
import { gotoAndWait, setLanguage } from './utils/language';

const servicesUrl = '/services';
const templatesUrl = '/reports/templates';

test.describe('Services → Templates funnel', () => {
  test('Templates CTA routes to reports templates', async ({ page }) => {
    await setLanguage(page, 'fr');
    await gotoAndWait(page, servicesUrl);
    await page.locator('[data-test="services-cta-templates"]').click();
    await page.waitForURL('**/reports/templates');
    await expect(page).toHaveURL(/\/reports\/templates$/);
    await expect(page.locator('[data-test="reports-templates-title"]')).toBeVisible();
  });
});
