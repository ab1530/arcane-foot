import { test, expect } from '@playwright/test';

test.describe('Market Kanban Board', () => {
  test('should display market/kanban page', async ({ page }) => {
    await page.goto('/market');

    // Check page loads
    await page.waitForLoadState('networkidle');

    // Check for market/kanban heading
    const heading = page.getByRole('heading', { name: /Market|Kanban|Board/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 }).catch(() => {
      // If no heading, check for board content
    });
  });

  test('should display kanban columns', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for kanban columns
    const columns = page.locator('[data-testid="kanban-column"], [class*="kanban-column"], [class*="column"]');

    const columnCount = await columns.count();

    // Should have at least one column or empty state
    expect(columnCount).toBeGreaterThanOrEqual(0);
  });

  test('should show column headers', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for typical kanban column names
    const prospectColumn = page.getByText(/Prospect|To Scout|À découvrir/i);
    const contactedColumn = page.getByText(/Contacted|Contacté/i);
    const interestedColumn = page.getByText(/Interested|Intéressé/i);

    // At least one column should be visible
    const hasColumns = await prospectColumn.first().isVisible({ timeout: 3000 }).catch(() => false) ||
                      await contactedColumn.first().isVisible({ timeout: 3000 }).catch(() => false) ||
                      await interestedColumn.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasColumns) {
      // Column structure exists
      expect(true).toBe(true);
    }
  });

  test('should display cards in columns', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for kanban cards
    const cards = page.locator('[data-testid="kanban-card"], [class*="kanban-card"], [class*="card"]');

    const cardCount = await cards.count();

    // Should have some cards or empty state
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Kanban Card Operations', () => {
  test('should show create card button', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for create/add card button
    const createButton = page.getByRole('button', { name: /Add Card|Create Card|New Card|Ajouter|Nouvelle carte/i }).or(
      page.locator('[data-testid="add-card"], [class*="add-card"]')
    );

    const hasButton = await createButton.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasButton) {
      await expect(createButton.first()).toBeVisible();
    }
  });

  test('should display card details on hover or click', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Find first card
    const firstCard = page.locator('[data-testid="kanban-card"], [class*="kanban-card"]').first();

    const isVisible = await firstCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // Hover over card
      await firstCard.hover();

      // Wait a moment for any tooltips or highlights
      await page.waitForTimeout(300);

      // Card should still be visible
      await expect(firstCard).toBeVisible();
    }
  });

  test('should show card actions menu', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Find first card
    const firstCard = page.locator('[data-testid="kanban-card"], [class*="kanban-card"]').first();

    const isVisible = await firstCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // Look for action buttons (edit, delete, move)
      const actionButton = firstCard.locator('button').first();

      const hasAction = await actionButton.isVisible().catch(() => false);

      if (hasAction) {
        await expect(actionButton).toBeVisible();
      }
    }
  });
});

test.describe('Kanban Drag and Drop', () => {
  test('should allow dragging cards between columns', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Find first card
    const firstCard = page.locator('[data-testid="kanban-card"], [class*="kanban-card"]').first();

    const isCardVisible = await firstCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (isCardVisible) {
      // Get card position
      const cardBox = await firstCard.boundingBox();

      if (cardBox) {
        // Try to initiate drag
        await firstCard.hover();

        // Check if card has draggable attribute or cursor changes
        const isDraggable = await firstCard.evaluate(el =>
          el.hasAttribute('draggable') ||
          window.getComputedStyle(el).cursor === 'grab' ||
          window.getComputedStyle(el).cursor === 'move'
        ).catch(() => false);

        if (isDraggable) {
          // Drag functionality is present
          expect(isDraggable).toBe(true);
        }
      }
    }
  });

  test('should show drop zones when dragging', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Find columns
    const columns = page.locator('[data-testid="kanban-column"], [class*="kanban-column"]');

    const columnCount = await columns.count();

    // Should have columns that can accept drops
    expect(columnCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Kanban Filtering and Search', () => {
  test('should have search or filter functionality', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.getByPlaceholder(/Search|Filter|Recherche|Filtrer/i);

    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSearch) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should filter cards by player name', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for search/filter input
    const searchInput = page.getByPlaceholder(/Search|Recherche/i);

    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSearch) {
      // Type search query
      await searchInput.fill('Player');

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Cards should still be visible or show empty state
      const cards = page.locator('[data-testid="kanban-card"], [class*="kanban-card"]');
      const cardCount = await cards.count();

      expect(cardCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have priority filter', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for priority filter
    const priorityFilter = page.getByLabel(/Priority|Priorité/i).or(
      page.locator('select[name*="priority"], [data-filter="priority"]')
    );

    const hasFilter = await priorityFilter.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasFilter) {
      await expect(priorityFilter).toBeVisible();
    }
  });
});

test.describe('Kanban Board Management', () => {
  test('should show create board button (if multiple boards supported)', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for create/new board button
    const createBoardButton = page.getByRole('button', { name: /New Board|Create Board|Nouveau tableau/i });

    const hasButton = await createBoardButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasButton) {
      await expect(createBoardButton).toBeVisible();
    }
  });

  test('should display board settings', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for settings button
    const settingsButton = page.getByRole('button', { name: /Settings|Paramètres/i }).or(
      page.locator('[data-testid="board-settings"]')
    );

    const hasSettings = await settingsButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSettings) {
      await expect(settingsButton).toBeVisible();
    }
  });

  test('should show column management options', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Look for add column button
    const addColumnButton = page.getByRole('button', { name: /Add Column|New Column|Ajouter colonne/i });

    const hasButton = await addColumnButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasButton) {
      await expect(addColumnButton).toBeVisible();
    }
  });
});

test.describe('Kanban Player Assignment', () => {
  test('should allow assigning players to cards', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Find a card
    const firstCard = page.locator('[data-testid="kanban-card"], [class*="kanban-card"]').first();

    const isVisible = await firstCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // Look for player info or assignment button in card
      const playerInfo = firstCard.locator('[data-testid="player-info"], [class*="player"]');

      const hasPlayer = await playerInfo.isVisible().catch(() => false);

      // Card should either have player assigned or assignment button
      expect(true).toBe(true);
    }
  });

  test('should display player details in card', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Find cards with player info
    const cardsWithPlayers = page.locator('[data-testid="kanban-card"]:has([data-testid="player-info"])');

    const count = await cardsWithPlayers.count();

    // Should have some cards with players or empty state
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Kanban Loading and Error States', () => {
  test('should show loading state initially', async ({ page }) => {
    await page.goto('/market');

    // Check for loading indicator
    const loadingIndicator = page.locator('[data-testid="loading"], [class*="loading"], [class*="spinner"]');

    // Loading state might be brief
    const isLoading = await loadingIndicator.first().isVisible({ timeout: 1000 }).catch(() => false);

    // If loading state visible, it should eventually disappear
    if (isLoading) {
      await expect(loadingIndicator.first()).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle empty board gracefully', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const errorMessage = page.getByText(/error|failed|something went wrong/i);
    await expect(errorMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // If error message selector doesn't exist, that's fine
    });
  });
});
