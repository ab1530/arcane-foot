import { Page, expect } from '@playwright/test';

/**
 * Test helpers and utilities for E2E tests
 */

/**
 * Wait for page to be fully loaded with network idle
 */
export async function waitForPageLoad(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Fill form field by label
 */
export async function fillFieldByLabel(page: Page, label: string, value: string) {
  const field = page.getByLabel(label, { exact: false });
  await field.fill(value);
}

/**
 * Fill form field by placeholder
 */
export async function fillFieldByPlaceholder(page: Page, placeholder: string, value: string) {
  const field = page.getByPlaceholder(placeholder, { exact: false });
  await field.fill(value);
}

/**
 * Click button by text
 */
export async function clickButton(page: Page, text: string) {
  const button = page.getByRole('button', { name: new RegExp(text, 'i') });
  await button.click();
}

/**
 * Check if element is visible with optional timeout
 */
export async function isElementVisible(page: Page, selector: string, timeout = 3000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for toast message
 */
export async function waitForToast(page: Page, message: string, timeout = 5000) {
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: message });
  await expect(toast).toBeVisible({ timeout });
}

/**
 * Wait for error toast
 */
export async function waitForErrorToast(page: Page, timeout = 5000) {
  const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
  await expect(errorToast).toBeVisible({ timeout });
}

/**
 * Wait for success toast
 */
export async function waitForSuccessToast(page: Page, timeout = 5000) {
  const successToast = page.locator('[data-sonner-toast][data-type="success"]');
  await expect(successToast).toBeVisible({ timeout });
}

/**
 * Check if page has specific heading
 */
export async function hasHeading(page: Page, text: string, level?: number) {
  const heading = level
    ? page.getByRole('heading', { level, name: new RegExp(text, 'i') })
    : page.getByRole('heading', { name: new RegExp(text, 'i') });
  await expect(heading).toBeVisible();
}

/**
 * Navigate and wait for page load
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await waitForPageLoad(page);
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, endpoint: string, response: any) {
  await page.route(`**/${endpoint}`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock API error
 */
export async function mockApiError(page: Page, endpoint: string, status = 500, message = 'Internal Server Error') {
  await page.route(`**/${endpoint}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: message }),
    });
  });
}

/**
 * Take screenshot on failure
 */
export async function takeScreenshotOnFailure(page: Page, testInfo: any) {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot();
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
}

/**
 * Clear all cookies and storage
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Set auth token in localStorage
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token);
  }, token);
}

/**
 * Mock authenticated session
 */
export async function mockAuthSession(page: Page) {
  await page.evaluate(() => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'SCOUT',
    };
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    localStorage.setItem('auth_token', 'mock-token-12345');
  });
}
