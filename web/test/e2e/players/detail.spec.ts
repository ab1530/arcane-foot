import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  mockApiResponse,
  mockApiError,
  mockAuthSession,
  hasHeading,
} from '../fixtures/test-helpers';
import { TEST_PLAYERS, TEST_REPORTS } from '../fixtures/test-data';

test.describe('Player Detail Page', () => {
  const testPlayer = {
    ...TEST_PLAYERS[0],
    scoutingReports: [
      {
        id: 'report-1',
        status: 'APPROVED',
        recommendation: 'BUY_NOW',
        summary: 'Excellent performance in recent matches',
        overallRating: 90,
        technicalRating: 92,
        physicalRating: 88,
        mentalRating: 95,
        tacticalRating: 90,
        createdAt: '2024-01-15T10:00:00Z',
        scout: {
          firstName: 'John',
          lastName: 'Doe',
        },
        match: {
          homeTeam: { name: 'FC Barcelona' },
          awayTeam: { name: 'Real Madrid' },
        },
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await mockAuthSession(page);
  });

  test.describe('Page Load and UI', () => {
    test('should display player detail page with all elements', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check player name is visible
      await expect(page.getByText(`${testPlayer.firstName} ${testPlayer.lastName}`).first()).toBeVisible();

      // Check position and nationality
      await expect(page.getByText(testPlayer.position)).toBeVisible();
      await expect(page.getByText(testPlayer.nationality)).toBeVisible();

      // Check action buttons
      await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /new report/i })).toBeVisible();
    });

    test('should show loading state while fetching player', async ({ page }) => {
      // Delay API response
      await page.route('**/api/players/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ player: testPlayer }),
        });
      });

      await page.goto(`/players/${testPlayer.id}`);

      // Check loading spinner
      await expect(page.getByText(/loading player/i)).toBeVisible();

      // Wait for player to load
      await expect(page.getByText(/loading player/i)).not.toBeVisible({ timeout: 5000 });
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check breadcrumb
      await expect(page.getByRole('link', { name: /players/i })).toBeVisible();
    });
  });

  test.describe('Player Information Card', () => {
    test('should display player profile card with all details', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check personal info
      await expect(page.getByText(testPlayer.nationality)).toBeVisible();
      await expect(page.getByText(`${testPlayer.height} cm`)).toBeVisible();
      await expect(page.getByText(`${testPlayer.weight} kg`)).toBeVisible();
      await expect(page.getByText(testPlayer.preferredFoot)).toBeVisible();

      // Check club if available
      if (testPlayer.currentClub) {
        await expect(page.getByText(testPlayer.currentClub.name)).toBeVisible();
      }
    });

    test('should display player rating badge', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check rating badge (90 from the test report)
      const ratingBadge = page.locator('.bg-arcane-accent').filter({ hasText: '90' }).first();
      await expect(ratingBadge).toBeVisible();
    });

    test('should display age correctly', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Should show age in years
      await expect(page.getByText(/\d+ years/)).toBeVisible();
    });
  });

  test.describe('Average Ratings Section', () => {
    test('should display average ratings when reports exist', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check ratings section
      await expect(page.getByText(/average ratings/i)).toBeVisible();
      await expect(page.getByText(/1 report/i)).toBeVisible();

      // Check individual rating categories
      await expect(page.getByText(/overall/i).first()).toBeVisible();
      await expect(page.getByText(/technical/i).first()).toBeVisible();
      await expect(page.getByText(/physical/i).first()).toBeVisible();
      await expect(page.getByText(/mental/i).first()).toBeVisible();
      await expect(page.getByText(/tactical/i).first()).toBeVisible();
    });

    test('should show no reports message when no reports exist', async ({ page }) => {
      const playerWithoutReports = { ...testPlayer, scoutingReports: [] };
      await mockApiResponse(page, 'api/players/*', { player: playerWithoutReports });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Should show empty state
      await expect(page.getByText(/no scouting reports available/i)).toBeVisible();
    });

    test('should display rating values with animated counters', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check that rating numbers are visible
      await expect(page.locator('text=/^90$/').first()).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Report Statistics', () => {
    test('should display approved reports count', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check approved reports stat
      await expect(page.getByText(/approved reports/i)).toBeVisible();
    });

    test('should display pending review count', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check pending review stat
      await expect(page.getByText(/pending review/i)).toBeVisible();
    });
  });

  test.describe('Scouting Reports Section', () => {
    test('should display list of scouting reports', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check reports section heading
      await expect(page.getByText(/scouting reports/i).first()).toBeVisible();

      // Check report card exists
      await expect(page.getByText(/excellent performance/i)).toBeVisible();

      // Check report status badge
      await expect(page.getByText('APPROVED').first()).toBeVisible();

      // Check recommendation
      await expect(page.getByText(/buy now/i)).toBeVisible();

      // Check scout name
      await expect(page.getByText(/scout: john doe/i)).toBeVisible();
    });

    test('should show create report button', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check create report button
      const createButton = page.getByRole('button', { name: /create report/i });
      await expect(createButton).toBeVisible();
    });

    test('should navigate to report detail when clicking on report', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Click on report card
      await page.getByText(/excellent performance/i).click();

      // Should navigate to report detail page
      await expect(page).toHaveURL(/\/reports\/[a-zA-Z0-9-]+/);
    });

    test('should show empty state when no reports exist', async ({ page }) => {
      const playerWithoutReports = { ...testPlayer, scoutingReports: [] };
      await mockApiResponse(page, 'api/players/*', { player: playerWithoutReports });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Should show empty state
      await expect(page.getByText(/no reports yet/i)).toBeVisible();
      await expect(page.getByText(/be the first to create/i)).toBeVisible();

      // Check create first report button
      await expect(page.getByRole('button', { name: /create first report/i })).toBeVisible();
    });

    test('should display report metadata', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check date is displayed
      await expect(page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/')).toBeVisible();

      // Check match info is displayed
      await expect(page.getByText(/fc barcelona vs real madrid/i)).toBeVisible();
    });

    test('should display overall rating for each report', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check overall rating badge
      await expect(page.locator('text=/^90$/').last()).toBeVisible();
      await expect(page.getByText(/overall/i).last()).toBeVisible();
    });
  });

  test.describe('Navigation Actions', () => {
    test('should navigate back to players list', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Click back button
      await page.getByRole('button', { name: /back/i }).click();

      // Should navigate to players page
      await expect(page).toHaveURL('/players');
    });

    test('should navigate to create report with player ID', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Click new report button
      await page.getByRole('button', { name: /new report/i }).first().click();

      // Should navigate to new report page with player ID
      await expect(page).toHaveURL(new RegExp(`/reports/new\\?playerId=${testPlayer.id}`));
    });

    test('should navigate to players list via breadcrumb', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Click on Players in breadcrumb
      await page.getByRole('link', { name: /players/i }).click();

      // Should navigate to players page
      await expect(page).toHaveURL('/players');
    });
  });

  test.describe('Error States', () => {
    test('should show error message when player not found', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: null });

      await navigateAndWait(page, '/players/non-existent-id');

      // Should show not found message
      await expect(page.getByText(/player not found/i)).toBeVisible();
      await expect(page.getByText(/could not be found/i)).toBeVisible();

      // Check back to players button
      await expect(page.getByRole('button', { name: /back to players/i })).toBeVisible();
    });

    test('should handle API error gracefully', async ({ page }) => {
      await mockApiError(page, 'api/players/*', 500, 'Server Error');

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Should show error toast or message
      await expect(page.getByText(/erreur|error/i)).toBeVisible({ timeout: 5000 });
    });

    test('should handle network error', async ({ page }) => {
      await page.route('**/api/players/*', route => route.abort('failed'));

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Should handle network failure
      await expect(page.getByText(/erreur|error/i)).toBeVisible({ timeout: 5000 });
    });

    test('should navigate back when player not found', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: null });

      await navigateAndWait(page, '/players/non-existent-id');

      // Click back button
      await page.getByRole('button', { name: /back to players/i }).click();

      // Should navigate to players page
      await expect(page).toHaveURL('/players');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Main elements should be visible
      await expect(page.getByText(`${testPlayer.firstName} ${testPlayer.lastName}`).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    });

    test('should stack layout on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Content should be stacked vertically
      await expect(page.getByText(/average ratings/i)).toBeVisible();
      await expect(page.getByText(/scouting reports/i).first()).toBeVisible();
    });

    test('should show grid layout on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // All sections should be visible
      await expect(page.getByText(testPlayer.nationality)).toBeVisible();
      await expect(page.getByText(/average ratings/i)).toBeVisible();
    });
  });

  test.describe('Report Status Badges', () => {
    test('should display approved status badge with correct color', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      const approvedBadge = page.getByText('APPROVED').first();
      await expect(approvedBadge).toBeVisible();
      await expect(approvedBadge).toHaveClass(/green/);
    });

    test('should display different recommendation types', async ({ page }) => {
      const playerWithMultipleReports = {
        ...testPlayer,
        scoutingReports: [
          { ...testPlayer.scoutingReports[0], recommendation: 'BUY_NOW' },
          { ...testPlayer.scoutingReports[0], id: 'report-2', recommendation: 'MONITOR' },
          { ...testPlayer.scoutingReports[0], id: 'report-3', recommendation: 'NOT_INTERESTED' },
        ],
      };

      await mockApiResponse(page, 'api/players/*', { player: playerWithMultipleReports });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check different recommendations are displayed
      await expect(page.getByText(/buy now/i)).toBeVisible();
      await expect(page.getByText(/monitor/i)).toBeVisible();
      await expect(page.getByText(/not interested/i)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Tab through interactive elements
      await page.keyboard.press('Tab'); // Focus back button
      await expect(page.getByRole('button', { name: /back/i })).toBeFocused();

      await page.keyboard.press('Tab'); // Focus edit button
      await expect(page.getByRole('button', { name: /edit profile/i })).toBeFocused();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await mockApiResponse(page, 'api/players/*', { player: testPlayer });

      await navigateAndWait(page, `/players/${testPlayer.id}`);

      // Check h1 exists
      const h1 = page.locator('h1').filter({ hasText: testPlayer.lastName });
      await expect(h1).toBeVisible();

      // Check section headings
      await expect(page.locator('h3').filter({ hasText: /average ratings/i })).toBeVisible();
      await expect(page.locator('h3').filter({ hasText: /scouting reports/i })).toBeVisible();
    });
  });
});
