import { test, expect } from '@playwright/test';

test.describe('Arkane AI Hub', () => {
  test('affiche le hub AI avec les cartes fonctionnalités', async ({ page }) => {
    await page.goto('/ai');
    await expect(page.getByRole('heading', { level: 1, name: /^Arkane AI$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Essayer ArkaneGPT/i })).toBeVisible();
  });
});

test.describe('ArkaneGPT', () => {
  test('génère une réponse IA', async ({ page }) => {
    await page.route('**/api/ai/summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: "Réponse IA : Mbappé reste le profil numéro 1 pour l'an prochain.",
          confidence: 0.82,
          source: 'playwright-test',
        }),
      });
    });

    await page.goto('/ai/arkane-gpt');
    await page.getByPlaceholder('Posez votre question sur le football...').fill('Quel est le meilleur joueur français ?');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByText("Réponse IA : Mbappé reste le profil numéro 1 pour l'an prochain.")).toBeVisible();
  });
});

test.describe('ArkaneIndex', () => {
  test('synchronise le score depuis l’API', async ({ page }) => {
    await page.route('**/api/ai/index/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          playerId: 'demo-player',
          overallScore: 78,
          breakdown: [],
          updatedAt: new Date().toISOString(),
          source: 'playwright-test',
        }),
      });
    });

    await page.goto('/ai/arkane-index');
    await expect(page.getByRole('heading', { name: /ArkaneIndex/i })).toBeVisible();
    await expect(page.getByText('78', { exact: true })).toBeVisible();
  });
});
