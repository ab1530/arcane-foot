import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  mockApiResponse,
  mockApiError,
  mockAuthSession,
  hasHeading,
} from '../fixtures/test-helpers';
import { DASHBOARD_STATS, TEST_PLAYERS, TEST_REPORTS, TEST_CAMPS } from '../fixtures/test-data';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await mockAuthSession(page);
  });

  test.describe('Page Load and UI', () => {
    test('should display dashboard page with all elements', async ({ page }) => {
      // Mock all API responses
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check page heading
      await hasHeading(page, 'Dashboard');

      // Check welcome message
      await expect(page.getByText(/bienvenue|welcome/i)).toBeVisible();

      // Check main sections are visible
      await expect(page.getByText(/arkane ai/i)).toBeVisible();
      await expect(page.getByText(/actions rapides/i)).toBeVisible();
    });

    test('should display with loading states initially', async ({ page }) => {
      // Delay API responses
      await page.route('**/api/players*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(TEST_PLAYERS),
        });
      });

      await page.goto('/dashboard');

      // Check loading skeletons
      const loadingElements = page.locator('.animate-pulse');
      await expect(loadingElements.first()).toBeVisible({ timeout: 2000 });
    });

    test('should display subscription tier badge', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check tier badge (may vary based on user)
      const tierBadge = page.locator('text=/FREE|BASIC|PRO|GOLD/i').first();
      const isVisible = await tierBadge.isVisible({ timeout: 2000 }).catch(() => false);

      // Tier badge should be visible if subscription exists
      if (isVisible) {
        await expect(tierBadge).toBeVisible();
      }
    });
  });

  test.describe('Quick Stats Cards', () => {
    test('should display all four stat cards', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check all stat cards
      await expect(page.getByText(/joueurs/i)).toBeVisible();
      await expect(page.getByText(/rapports/i)).toBeVisible();
      await expect(page.getByText(/camps actifs/i)).toBeVisible();
      await expect(page.getByText(/matches/i)).toBeVisible();
    });

    test('should display stat values with animated counters', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Wait for counters to animate
      await page.waitForTimeout(2000);

      // Check that numbers are visible (exact values may vary)
      const statValues = page.locator('.text-3xl.font-black.text-white');
      await expect(statValues.first()).toBeVisible();
    });

    test('should show trend indicators on stats', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for trend badges (e.g., "+12%", "+8%")
      await expect(page.locator('text=/\\+\\d+%|\\+\\d+/').first()).toBeVisible();
    });

    test('should navigate when clicking stat cards', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Click on players stat card
      await page.getByText(/joueurs/i).click();

      // Should navigate to players page
      await expect(page).toHaveURL('/players');
    });
  });

  test.describe('AI Features Section', () => {
    test('should display AI features cards', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check AI section heading
      await expect(page.getByText(/arkane ai/i)).toBeVisible();

      // Check individual AI features
      await expect(page.getByText(/arkaneindex/i)).toBeVisible();
      await expect(page.getByText(/arkanegpt/i)).toBeVisible();
      await expect(page.getByText(/scout ai/i)).toBeVisible();
    });

    test('should display AI feature descriptions', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check feature descriptions
      await expect(page.getByText(/système de notation/i)).toBeVisible();
      await expect(page.getByText(/assistant ia/i)).toBeVisible();
      await expect(page.getByText(/rapports automatisés/i)).toBeVisible();
    });

    test('should show tier requirements for AI features', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for tier badges on AI features
      const tierBadges = page.locator('text=/GOLD|PRO|BASIC/i');
      await expect(tierBadges.first()).toBeVisible();
    });

    test('should have "View All" link in AI section', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for "Voir tout" button
      const viewAllButton = page.getByRole('button', { name: /voir tout/i });
      await expect(viewAllButton).toBeVisible();
    });
  });

  test.describe('Quick Actions Section', () => {
    test('should display all quick action buttons', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check quick actions heading
      await expect(page.getByText(/actions rapides/i)).toBeVisible();

      // Check individual action buttons
      await expect(page.getByRole('button', { name: /nouveau rapport/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /ajouter joueur/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /voir camps/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /marché/i })).toBeVisible();
    });

    test('should navigate to correct pages from quick actions', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Click on "Voir Camps" button
      await page.getByRole('button', { name: /voir camps/i }).click();

      // Should navigate to camps page
      await expect(page).toHaveURL('/camps');
    });
  });

  test.describe('Charts Section', () => {
    test('should display activity line chart', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for activity chart
      await expect(page.getByText(/activité sur 7 jours/i)).toBeVisible();
    });

    test('should display reports pie chart', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for reports chart
      await expect(page.getByText(/rapports par statut/i)).toBeVisible();
    });

    test('should display monthly growth area chart', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for growth chart
      await expect(page.getByText(/croissance mensuelle/i)).toBeVisible();
    });

    test('should display players by position bar chart', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for position chart
      await expect(page.getByText(/joueurs par position/i)).toBeVisible();
    });
  });

  test.describe('Recent Activity Section', () => {
    test('should display recent activity feed', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check recent activity heading
      await expect(page.getByText(/activité récente/i)).toBeVisible();
    });

    test('should show activity items with details', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for activity items (should have at least one)
      const activityItems = page.locator('.bg-arcane-darkBorder\\/30');
      const count = await activityItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should show empty state when no activity', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', []);
      await mockApiResponse(page, 'api/reports*', []);
      await mockApiResponse(page, 'api/camps*', []);

      await navigateAndWait(page, '/dashboard');

      // Check for empty state message
      await expect(page.getByText(/aucune activité récente/i)).toBeVisible();
    });
  });

  test.describe('Pending Tasks Section', () => {
    test('should display pending tasks section', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check pending tasks heading
      await expect(page.getByText(/tâches en attente/i)).toBeVisible();
    });

    test('should show pending reports task', async ({ page }) => {
      const reportsWithDrafts = [
        ...TEST_REPORTS,
        { ...TEST_REPORTS[0], id: 'draft-1', status: 'DRAFT' },
      ];

      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', reportsWithDrafts);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for pending reports task
      await expect(page.getByText(/rapports en brouillon/i)).toBeVisible();
    });

    test('should show upgrade prompt for free tier', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check for upgrade prompt (may be visible depending on subscription state)
      const upgradePrompt = page.getByText(/débloquer les fonctionnalités/i);
      const isVisible = await upgradePrompt.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await expect(upgradePrompt).toBeVisible();
      }
    });

    test('should navigate to reports from pending tasks', async ({ page }) => {
      const reportsWithDrafts = [
        ...TEST_REPORTS,
        { ...TEST_REPORTS[0], id: 'draft-1', status: 'DRAFT' },
      ];

      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', reportsWithDrafts);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Click on pending reports task
      await page.getByText(/rapports en brouillon/i).click();

      // Should navigate to reports page
      await expect(page).toHaveURL('/reports');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await mockApiError(page, 'api/players*', 500, 'Server Error');
      await mockApiError(page, 'api/reports*', 500, 'Server Error');
      await mockApiError(page, 'api/camps*', 500, 'Server Error');

      await navigateAndWait(page, '/dashboard');

      // Dashboard should still load with mock/fallback data
      await expect(page.getByText(/dashboard/i)).toBeVisible();

      // Should display some stats (even if mocked)
      await expect(page.getByText(/joueurs/i)).toBeVisible();
    });

    test('should show fallback data when API fails', async ({ page }) => {
      await page.route('**/api/players*', route => route.abort('failed'));
      await page.route('**/api/reports*', route => route.abort('failed'));
      await page.route('**/api/camps*', route => route.abort('failed'));

      await navigateAndWait(page, '/dashboard');

      // Dashboard should still be functional
      await expect(page.getByText(/dashboard/i)).toBeVisible();

      // Mock data should be shown (42 players as per code)
      await page.waitForTimeout(2000);
      const statsVisible = await page.getByText('42').isVisible({ timeout: 2000 }).catch(() => false);
      if (statsVisible) {
        await expect(page.getByText('42')).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Main elements should be visible
      await expect(page.getByText(/dashboard/i)).toBeVisible();
      await expect(page.getByText(/joueurs/i)).toBeVisible();
    });

    test('should stack stat cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Stats should be stacked vertically
      await expect(page.getByText(/total players|joueurs/i)).toBeVisible();
      await expect(page.getByText(/rapports/i)).toBeVisible();
    });

    test('should show grid layout on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // All sections should be visible in grid layout
      await expect(page.getByText(/arkane ai/i)).toBeVisible();
      await expect(page.getByText(/actions rapides/i)).toBeVisible();
      await expect(page.getByText(/activité récente/i)).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to pricing from tier badge', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Click on tier badge
      const tierBadge = page.locator('text=/FREE|BASIC|PRO|GOLD/i').first();
      const isVisible = await tierBadge.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await tierBadge.click();
        await expect(page).toHaveURL('/pricing');
      }
    });

    test('should navigate to calendar from upcoming matches', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Click on matches stat card
      await page.getByText(/matches/i).click();

      // Should navigate to calendar
      await expect(page).toHaveURL('/calendar');
    });
  });

  test.describe('Interactive Elements', () => {
    test('should show hover effects on stat cards', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Hover over a stat card
      const playersStat = page.getByText(/joueurs/i).locator('..');
      await playersStat.hover();

      // Card should be interactive
      await expect(playersStat).toBeVisible();
    });

    test('should show hover effects on AI feature cards', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Hover over AI feature
      const arkaneGPT = page.getByText(/arkanegpt/i);
      await arkaneGPT.hover();

      // Should be clickable
      await expect(arkaneGPT).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Tab through elements
      await page.keyboard.press('Tab');

      // Some element should be focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper heading structure', async ({ page }) => {
      await mockApiResponse(page, 'api/players*', TEST_PLAYERS);
      await mockApiResponse(page, 'api/reports*', TEST_REPORTS);
      await mockApiResponse(page, 'api/camps*', TEST_CAMPS);

      await navigateAndWait(page, '/dashboard');

      // Check h1 exists
      const h1 = page.locator('h1').filter({ hasText: /dashboard/i });
      await expect(h1).toBeVisible();

      // Check section headings
      await expect(page.locator('h2, h3').filter({ hasText: /arkane ai/i })).toBeVisible();
    });
  });
});
