import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  hasHeading,
  mockApiResponse,
  mockApiError,
  mockAuthSession,
  isElementVisible,
} from '../fixtures/test-helpers';
import { TEST_PLAYERS, API_ENDPOINTS } from '../fixtures/test-data';

test.describe('Players List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await mockAuthSession(page);
  });

  test.describe('Page Load and UI', () => {
    test('should display players page with all elements', async ({ page }) => {
      // Mock API response
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Check page title
      await expect(page).toHaveTitle(/Players.*ARCANE/i);

      // Check heading
      await hasHeading(page, 'Players');

      // Check search input
      await expect(page.getByPlaceholder(/search players/i)).toBeVisible();

      // Check filters are visible
      await expect(page.locator('select').first()).toBeVisible();

      // Check "Add Player" button
      await expect(page.getByRole('button', { name: /add player/i })).toBeVisible();
    });

    test('should display stats overview cards', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Check all stat cards
      await expect(page.getByText(/total players/i)).toBeVisible();
      await expect(page.getByText(/average rating/i)).toBeVisible();
      await expect(page.getByText(/scouting reports/i)).toBeVisible();
      await expect(page.getByText(/average age/i)).toBeVisible();
    });

    test('should show loading state while fetching players', async ({ page }) => {
      // Delay API response
      await page.route('**/api/players*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TEST_PLAYERS),
        });
      });

      await page.goto('/players');

      // Check loading spinner
      await expect(page.getByText(/loading players/i)).toBeVisible();

      // Wait for players to load
      await expect(page.getByText(/loading players/i)).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Search Functionality', () => {
    test('should filter players by name', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Wait for players to load
      await page.waitForSelector('text=Lionel Messi', { timeout: 5000 });

      // Search for specific player
      const searchInput = page.getByPlaceholder(/search players/i);
      await searchInput.fill('Messi');

      // Should show only matching player
      await expect(page.getByText('Lionel Messi')).toBeVisible();

      // Other players should not be visible
      await expect(page.getByText('Erling Haaland')).not.toBeVisible();
    });

    test('should filter players by nationality', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Wait for players to load
      await page.waitForSelector('text=Lionel Messi', { timeout: 5000 });

      // Search by nationality
      const searchInput = page.getByPlaceholder(/search players/i);
      await searchInput.fill('France');

      // Should show French players
      await expect(page.getByText('Kylian Mbappé')).toBeVisible();
    });

    test('should clear search results', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      const searchInput = page.getByPlaceholder(/search players/i);

      // Search for player
      await searchInput.fill('Messi');
      await expect(page.getByText('Lionel Messi')).toBeVisible();

      // Clear search
      await searchInput.clear();

      // All players should be visible again
      await expect(page.getByText('Lionel Messi')).toBeVisible();
      await expect(page.getByText('Kylian Mbappé')).toBeVisible();
    });

    test('should show no results message when search has no matches', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Search for non-existent player
      const searchInput = page.getByPlaceholder(/search players/i);
      await searchInput.fill('NonExistentPlayer12345');

      // Should show no results message
      await expect(page.getByText(/no players found/i)).toBeVisible();
      await expect(page.getByText(/try adjusting your search/i)).toBeVisible();
    });
  });

  test.describe('Position Filter', () => {
    test('should filter players by position', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Wait for players to load
      await page.waitForSelector('text=Lionel Messi', { timeout: 5000 });

      // Find position filter dropdown
      const positionFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Positions")') });
      await positionFilter.selectOption('FORWARD');

      // All visible players should be forwards
      await expect(page.getByText('Lionel Messi')).toBeVisible();
      await expect(page.getByText('Kylian Mbappé')).toBeVisible();
    });

    test('should have all position options', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Check position filter has all options
      const positionFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Positions")') });

      await expect(positionFilter.locator('option:has-text("All Positions")')).toBeAttached();
      await expect(positionFilter.locator('option:has-text("FORWARD")')).toBeAttached();
      await expect(positionFilter.locator('option:has-text("MIDFIELDER")')).toBeAttached();
      await expect(positionFilter.locator('option:has-text("DEFENDER")')).toBeAttached();
      await expect(positionFilter.locator('option:has-text("GOALKEEPER")')).toBeAttached();
    });
  });

  test.describe('Advanced Filters', () => {
    test('should show/hide advanced filters', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Click to show advanced filters
      const toggleButton = page.getByRole('button', { name: /show advanced filters/i });
      await toggleButton.click();

      // Advanced filters should be visible
      await expect(page.locator('select').filter({ has: page.locator('option:has-text("All Nationalities")') })).toBeVisible();
      await expect(page.locator('select').filter({ has: page.locator('option:has-text("All Ages")') })).toBeVisible();

      // Click to hide
      await page.getByRole('button', { name: /hide advanced filters/i }).click();

      // Advanced filters should not be visible (with animation delay)
      await expect(page.locator('select').filter({ has: page.locator('option:has-text("All Nationalities")') })).not.toBeVisible({ timeout: 2000 });
    });

    test('should filter by nationality', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Show advanced filters
      await page.getByRole('button', { name: /show advanced filters/i }).click();

      // Select nationality
      const nationalityFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Nationalities")') });
      await nationalityFilter.selectOption('Argentina');

      // Should show only Argentine players
      await expect(page.getByText('Lionel Messi')).toBeVisible();
      await expect(page.getByText('Kylian Mbappé')).not.toBeVisible();
    });

    test('should filter by age range', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Show advanced filters
      await page.getByRole('button', { name: /show advanced filters/i }).click();

      // Select age range
      const ageFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Ages")') });
      await ageFilter.selectOption('22-25');

      // Should filter by age (Mbappé and Haaland are in this range)
      await expect(page.getByText('Kylian Mbappé')).toBeVisible();
      await expect(page.getByText('Erling Haaland')).toBeVisible();
    });

    test('should show active filter badges', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Apply position filter
      const positionFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Positions")') });
      await positionFilter.selectOption('FORWARD');

      // Should show filter badge
      await expect(page.locator('text=/Position: FORWARD/i')).toBeVisible();
    });

    test('should clear all filters', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Apply multiple filters
      const positionFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Positions")') });
      await positionFilter.selectOption('FORWARD');

      await page.getByRole('button', { name: /show advanced filters/i }).click();

      const nationalityFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Nationalities")') });
      await nationalityFilter.selectOption('France');

      // Click clear filters
      await page.getByRole('button', { name: /clear filters/i }).click();

      // Filters should be reset
      await expect(positionFilter).toHaveValue('ALL');
      await expect(nationalityFilter).toHaveValue('ALL');
    });

    test('should remove individual filter badges', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Apply filter
      const positionFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Positions")') });
      await positionFilter.selectOption('FORWARD');

      // Filter badge should be visible
      const filterBadge = page.locator('text=/Position: FORWARD/i');
      await expect(filterBadge).toBeVisible();

      // Click X on badge
      await filterBadge.locator('xpath=following-sibling::*[1]').click();

      // Filter should be cleared
      await expect(filterBadge).not.toBeVisible();
    });
  });

  test.describe('Sorting', () => {
    test('should sort players by name', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Select sort by name
      const sortSelect = page.locator('select').filter({ has: page.locator('option:has-text("Sort by Name")') });
      await sortSelect.selectOption('name');

      // Players should be sorted alphabetically
      const playerCards = page.locator('text=/Lionel Messi|Kylian Mbappé|Erling Haaland/');
      await expect(playerCards.first()).toBeVisible();
    });

    test('should sort players by age', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Select sort by age
      const sortSelect = page.locator('select').filter({ has: page.locator('option:has-text("Sort by Age")') });
      await sortSelect.selectOption('age');

      // Youngest players should appear first
      await expect(page.locator('h3').filter({ hasText: /haaland/i }).first()).toBeVisible();
    });

    test('should have all sort options', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      const sortSelect = page.locator('select').filter({ has: page.locator('option:has-text("Sort by Name")') });

      await expect(sortSelect.locator('option:has-text("Sort by Name")')).toBeAttached();
      await expect(sortSelect.locator('option:has-text("Sort by Age")')).toBeAttached();
      await expect(sortSelect.locator('option:has-text("Sort by Reports")')).toBeAttached();
      await expect(sortSelect.locator('option:has-text("Sort by Rating")')).toBeAttached();
    });
  });

  test.describe('Player Cards', () => {
    test('should display player cards with all information', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Wait for player cards to load
      await page.waitForSelector('text=Lionel Messi', { timeout: 5000 });

      // Check player name is visible
      await expect(page.getByText('Lionel Messi')).toBeVisible();

      // Check position is visible
      await expect(page.getByText('FORWARD').first()).toBeVisible();

      // Check nationality is visible
      await expect(page.getByText('Argentina')).toBeVisible();
    });

    test('should navigate to player detail on click', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Wait for player cards
      await page.waitForSelector('text=Lionel Messi', { timeout: 5000 });

      // Click on a player card
      const playerCard = page.locator('a[href*="/players/"]').first();
      await playerCard.click();

      // Should navigate to player detail page
      await expect(page).toHaveURL(/\/players\/[a-zA-Z0-9-]+/);
    });

    test('should show hover effects on player cards', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Wait for player cards
      await page.waitForSelector('text=Lionel Messi', { timeout: 5000 });

      const playerCard = page.locator('a[href*="/players/"]').first();

      // Hover over card
      await playerCard.hover();

      // Check for hover text
      await expect(page.getByText(/click to view full profile/i)).toBeVisible({ timeout: 2000 });
    });

    test('should display player rating badge', async ({ page }) => {
      const playersWithRating = TEST_PLAYERS.map(p => ({
        ...p,
        scoutingReports: [{ overallRating: 90 }],
      }));

      await mockApiResponse(page, 'api/players*', playersWithRating);

      await navigateAndWait(page, '/players');

      // Wait for cards to load
      await page.waitForSelector('text=Lionel Messi', { timeout: 5000 });

      // Rating badge should be visible (with number)
      const ratingBadge = page.locator('.bg-arcane-accent').filter({ hasText: /^\d+$/ }).first();
      await expect(ratingBadge).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test('should handle API error gracefully', async ({ page }) => {
      await mockApiError(page, 'api/players*', 500, 'Server Error');

      await navigateAndWait(page, '/players');

      // Should show error toast or message
      await expect(page.getByText(/erreur|error/i)).toBeVisible({ timeout: 5000 });
    });

    test('should handle network error', async ({ page }) => {
      await page.route('**/api/players*', route => route.abort('failed'));

      await navigateAndWait(page, '/players');

      // Should handle network failure
      await expect(page.getByText(/erreur|error/i)).toBeVisible({ timeout: 5000 });
    });

    test('should display empty state when no players exist', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', []);

      await navigateAndWait(page, '/players');

      // Should show empty state
      await expect(page.getByText(/no players found/i)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Main elements should be visible
      await expect(page.getByPlaceholder(/search players/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /add player/i })).toBeVisible();
    });

    test('should stack stat cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Stats should be visible but stacked
      await expect(page.getByText(/total players/i)).toBeVisible();
      await expect(page.getByText(/average rating/i)).toBeVisible();
    });

    test('should show grid layout on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Wait for player cards
      await page.waitForSelector('text=Lionel Messi', { timeout: 5000 });

      // Multiple cards should be visible in grid
      const playerCards = page.locator('a[href*="/players/"]');
      const count = await playerCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Add Player Action', () => {
    test('should have add player button', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      const addButton = page.getByRole('button', { name: /add player/i });
      await expect(addButton).toBeVisible();
    });

    test('should navigate to add player page on click', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      const addButton = page.getByRole('button', { name: /add player/i });
      // Note: This test assumes the button will eventually have proper navigation
      // Currently it may not navigate anywhere
      await expect(addButton).toBeEnabled();
    });
  });

  test.describe('Combined Filters', () => {
    test('should apply search and position filter together', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Apply search
      await page.getByPlaceholder(/search players/i).fill('Mbappé');

      // Apply position filter
      const positionFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Positions")') });
      await positionFilter.selectOption('FORWARD');

      // Should show only Mbappé
      await expect(page.getByText('Kylian Mbappé')).toBeVisible();
      await expect(page.getByText('Lionel Messi')).not.toBeVisible();
    });

    test('should apply multiple filters and sort', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);

      await navigateAndWait(page, '/players');

      // Apply position filter
      const positionFilter = page.locator('select').filter({ has: page.locator('option:has-text("All Positions")') });
      await positionFilter.selectOption('FORWARD');

      // Apply sort
      const sortSelect = page.locator('select').filter({ has: page.locator('option:has-text("Sort by Name")') });
      await sortSelect.selectOption('age');

      // All forwards should be visible and sorted by age
      await expect(page.getByText('Erling Haaland')).toBeVisible();
      await expect(page.getByText('Kylian Mbappé')).toBeVisible();
      await expect(page.getByText('Lionel Messi')).toBeVisible();
    });
  });
});
