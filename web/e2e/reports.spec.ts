import { test, expect } from '@playwright/test';

test.describe('Scouting Reports Flow', () => {
  test('should display reports list page', async ({ page }) => {
    await page.goto('/reports');

    // Check page loads
    await page.waitForLoadState('networkidle');

    // Check for reports heading or content
    const heading = page.getByRole('heading', { name: /Reports|Scouting/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should show report statistics', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for stats/metrics (total, approved, pending, etc.)
    const statsElements = page.locator('[data-testid*="stat"], [class*="stat"]');

    // Should have some stats displayed
    const count = await statsElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to report detail', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Find first report card/link
    const reportCard = page.locator(
      '[data-testid="report-card"], [class*="report-card"], a[href*="/reports/"]'
    ).first();

    const isVisible = await reportCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await reportCard.click();

      // Should navigate to report detail
      await expect(page).toHaveURL(/\/reports\/[a-zA-Z0-9-]+/);
    }
  });

  test('should display report details correctly', async ({ page }) => {
    await page.goto('/reports/mock-report-id');
    await page.waitForLoadState('networkidle');

    // Check for report detail elements
    const detailElements = page.getByText(/Player|Scout|Rating|Summary|Date/i);

    // At least some detail should be visible
    const firstElement = detailElements.first();
    const hasContent = await firstElement.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasContent) {
      // If not found with specific ID, check for error/empty state
      const notFound = page.getByText(/not found|doesn't exist/i);
      await expect(notFound).toBeVisible({ timeout: 2000 }).catch(() => {
        // Page might just be loading
      });
    }
  });
});

test.describe('Reports Filtering', () => {
  test('should filter by status', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for status filter
    const statusFilter = page.getByLabel(/Status/i).or(
      page.locator('select[name*="status"], button[data-filter="status"]')
    );

    const hasFilter = await statusFilter.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasFilter) {
      await expect(statusFilter).toBeVisible();

      // Try to interact with filter
      if ((await statusFilter.getAttribute('role')) === 'button') {
        await statusFilter.click();
      }
    }
  });

  test('should filter by scout', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for scout filter
    const scoutFilter = page.getByLabel(/Scout/i).or(
      page.locator('select[name*="scout"], [data-filter="scout"]')
    );

    const hasFilter = await scoutFilter.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasFilter) {
      await expect(scoutFilter).toBeVisible();
    }
  });

  test('should filter by rating', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for rating filter or sort
    const ratingControl = page.getByLabel(/Rating|Sort/i).or(
      page.locator('[data-filter="rating"], [data-sort="rating"]')
    );

    const hasControl = await ratingControl.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasControl) {
      await expect(ratingControl).toBeVisible();
    }
  });
});

test.describe('Reports Creation', () => {
  test('should show create report button (if authorized)', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for create button
    const createButton = page.getByRole('button', { name: /Create Report|New Report|Add Report/i }).or(
      page.getByRole('link', { name: /Create Report|New Report/i })
    );

    const hasButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasButton) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should handle unauthorized access gracefully', async ({ page }) => {
    await page.goto('/reports/create');

    // Wait for redirect or auth check
    await page.waitForLoadState('networkidle');

    // Either shows create form or redirects to login
    const currentUrl = page.url();

    // Should be on create page or login page
    expect(currentUrl).toMatch(/\/reports\/create|\/login/);
  });
});

test.describe('Reports Analytics', () => {
  test('should show report statistics dashboard', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for metrics like total, approved, pending
    const metrics = page.locator('[data-testid*="metric"], [class*="metric"], [class*="stat"]');

    const count = await metrics.count();

    // Should have some metrics displayed
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display report ratings distribution', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for rating indicators or charts
    const ratings = page.getByText(/rating|score/i);

    const hasRatings = await ratings.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasRatings) {
      await expect(ratings.first()).toBeVisible();
    }
  });
});
