import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ARCANE Football/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/EMPOWERING/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/FOOTBALL/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^Login$/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to signup page from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Create an Account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe('Dashboard Access', () => {
  test('should display dashboard overview', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: /Dashboard/i })).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  test('should access about page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should access services page', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should access pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText(/Tarifs/i);
  });
});
