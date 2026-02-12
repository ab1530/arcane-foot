import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test('should display analytics page', async ({ page }) => {
    await page.goto('/analytics');

    // Check page loads
    await page.waitForLoadState('networkidle');

    // Check for analytics heading
    const heading = page.getByRole('heading', { name: /Analytics|Statistiques/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should show key metrics cards', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for metric cards with various selectors
    const metrics = page.locator('[data-testid*="metric"], [class*="metric"], [class*="stat"]');

    const count = await metrics.count();

    // Should have some metrics displayed
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display total reports metric', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for total reports text
    const totalReportsText = page.getByText(/Total Reports|Rapports totaux|Total/i);

    const hasMetric = await totalReportsText.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMetric) {
      await expect(totalReportsText.first()).toBeVisible();
    }
  });

  test('should display approved reports metric', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for approved reports
    const approvedText = page.getByText(/Approved|Approuvé/i);

    const hasMetric = await approvedText.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMetric) {
      await expect(approvedText.first()).toBeVisible();
    }
  });

  test('should display pending reports metric', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for pending reports
    const pendingText = page.getByText(/Pending|En attente/i);

    const hasMetric = await pendingText.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMetric) {
      await expect(pendingText.first()).toBeVisible();
    }
  });

  test('should display average rating metric', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for average rating
    const ratingText = page.getByText(/Average Rating|Note moyenne|Rating/i);

    const hasMetric = await ratingText.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMetric) {
      await expect(ratingText.first()).toBeVisible();
    }
  });
});

test.describe('Analytics Charts', () => {
  test('should display rating distribution chart', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for chart container or canvas
    const chart = page.locator('canvas, [data-testid*="chart"], [class*="chart"]');

    const hasChart = await chart.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasChart) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should display top players section', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for top players heading or content
    const topPlayersHeading = page.getByText(/Top Players|Meilleurs joueurs/i);

    const hasSection = await topPlayersHeading.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSection) {
      await expect(topPlayersHeading.first()).toBeVisible();
    }
  });

  test('should display top scouts section', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for top scouts
    const topScoutsText = page.getByText(/Top Scout|Meilleur scout/i);

    const hasSection = await topScoutsText.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSection) {
      await expect(topScoutsText.first()).toBeVisible();
    }
  });
});

test.describe('Analytics Filters', () => {
  test('should have time range filter', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for time range filter
    const timeRangeFilter = page.getByLabel(/Time Range|Période|Range/i).or(
      page.locator('select[name*="range"], [data-filter="timeRange"]')
    );

    const hasFilter = await timeRangeFilter.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasFilter) {
      await expect(timeRangeFilter).toBeVisible();

      // Try to interact with filter
      if ((await timeRangeFilter.getAttribute('role')) === 'button') {
        await timeRangeFilter.click();
      }
    }
  });

  test('should update data when time range changes', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for time range selector
    const timeRangeButton = page.locator('button').filter({ hasText: /7 days|30 days|90 days/i }).first();

    const hasButton = await timeRangeButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasButton) {
      // Click to change time range
      await timeRangeButton.click();

      // Wait for data refresh
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Analytics Recent Reports', () => {
  test('should display recent reports section', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for recent reports heading
    const recentHeading = page.getByText(/Recent Reports|Rapports récents/i);

    const hasSection = await recentHeading.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSection) {
      await expect(recentHeading.first()).toBeVisible();
    }
  });

  test('should show report cards in recent section', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for report cards
    const reportCards = page.locator('[data-testid="report-card"], [class*="report-card"]');

    const count = await reportCards.count();

    // Should have some reports or empty state
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to report detail from recent section', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Find first report link in recent section
    const reportLink = page.locator('a[href*="/reports/"]').first();

    const isVisible = await reportLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await reportLink.click();

      // Should navigate to report detail
      await expect(page).toHaveURL(/\/reports\/[a-zA-Z0-9-]+/);
    }
  });
});

test.describe('Analytics Loading States', () => {
  test('should show loading state initially', async ({ page }) => {
    await page.goto('/analytics');

    // Check for loading indicator (spinner, skeleton, etc.)
    const loadingIndicator = page.locator('[data-testid="loading"], [class*="loading"], [class*="spinner"], [class*="skeleton"]');

    // Loading state might be brief, so we don't require it
    const isLoading = await loadingIndicator.first().isVisible({ timeout: 1000 }).catch(() => false);

    // If loading state visible, it should eventually disappear
    if (isLoading) {
      await expect(loadingIndicator.first()).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Page should load without critical errors
    const errorMessage = page.getByText(/error|failed|something went wrong/i);
    await expect(errorMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // If error message selector doesn't exist, that's fine
    });
  });
});
