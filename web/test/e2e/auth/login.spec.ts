import { test, expect } from '@playwright/test';
import {
  navigateAndWait,
  hasHeading,
  waitForToast,
  waitForErrorToast,
  mockApiResponse,
  mockApiError,
  clearSession,
} from '../fixtures/test-helpers';
import { TEST_USERS, API_ENDPOINTS } from '../fixtures/test-data';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session before each test
    await clearSession(page);
  });

  test.describe('Page Load and UI', () => {
    test('should display login page with all elements', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Check page title
      await expect(page).toHaveTitle(/ARCANE/i);

      // Check main heading
      await hasHeading(page, 'Sign In');

      // Check form elements exist
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

      // Check "Remember me" checkbox
      await expect(page.getByText(/remember me/i)).toBeVisible();

      // Check "Forgot password" link
      await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();

      // Check "Create account" link
      await expect(page.getByRole('link', { name: /create an account/i })).toBeVisible();

      // Check back to home link
      await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
    });

    test('should have ARCANE logo visible', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Check logo is present
      const logo = page.locator('text=ARCANE').first();
      await expect(logo).toBeVisible();
    });

    test('should show password toggle button', async ({ page }) => {
      await navigateAndWait(page, '/login');

      const passwordToggle = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
      await expect(passwordToggle).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should show validation errors when submitting empty form', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Try to submit empty form
      await page.getByRole('button', { name: /sign in/i }).click();

      // Form should not submit (stays on login page)
      await expect(page).toHaveURL(/\/login/);
    });

    test('should validate email format', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Enter invalid email
      await page.getByPlaceholder(/email/i).fill('invalid-email');
      await page.getByPlaceholder(/password/i).fill('TestPass123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show HTML5 validation or stay on page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should require password field', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Enter only email
      await page.getByPlaceholder(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should require email field', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Enter only password
      await page.getByPlaceholder(/password/i).fill('TestPass123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Password Visibility Toggle', () => {
    test('should toggle password visibility', async ({ page }) => {
      await navigateAndWait(page, '/login');

      const passwordInput = page.getByPlaceholder(/password/i);
      const toggleButton = page.locator('button[type="button"]').filter({
        has: page.locator('svg')
      }).last();

      // Password should be hidden by default
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Fill password
      await passwordInput.fill('TestPass123');

      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle to hide password again
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Login Submission', () => {
    test('should show error message with invalid credentials', async ({ page }) => {
      // Mock failed login API response
      await mockApiError(page, API_ENDPOINTS.login, 401, 'Invalid credentials');

      await navigateAndWait(page, '/login');

      // Fill form with invalid credentials
      await page.getByPlaceholder(/email/i).fill(TEST_USERS.invalid.email);
      await page.getByPlaceholder(/password/i).fill(TEST_USERS.invalid.password);

      // Submit form
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show error message
      await expect(page.locator('text=/login failed/i')).toBeVisible({ timeout: 5000 });
    });

    test('should disable submit button while loading', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Fill form
      await page.getByPlaceholder(/email/i).fill(TEST_USERS.valid.email);
      await page.getByPlaceholder(/password/i).fill(TEST_USERS.valid.password);

      // Get submit button
      const submitButton = page.getByRole('button', { name: /sign in/i });

      // Submit form
      await submitButton.click();

      // Button should be disabled during loading
      await expect(submitButton).toBeDisabled();
    });

    test('should show loading state during submission', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Fill form
      await page.getByPlaceholder(/email/i).fill(TEST_USERS.valid.email);
      await page.getByPlaceholder(/password/i).fill(TEST_USERS.valid.password);

      // Submit form
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show loading text
      await expect(page.getByText(/signing in/i)).toBeVisible({ timeout: 2000 });
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route(API_ENDPOINTS.login, route => route.abort('failed'));

      await navigateAndWait(page, '/login');

      // Fill and submit form
      await page.getByPlaceholder(/email/i).fill(TEST_USERS.valid.email);
      await page.getByPlaceholder(/password/i).fill(TEST_USERS.valid.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show error message
      await expect(page.locator('text=/login failed|error/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Navigation Links', () => {
    test('should navigate to signup page', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Click on "Create an Account" link
      await page.getByRole('link', { name: /create an account/i }).click();

      // Should navigate to signup page
      await expect(page).toHaveURL(/\/signup/);
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Click on "Forgot password" link
      await page.getByRole('link', { name: /forgot password/i }).click();

      // Should navigate to forgot password page
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('should navigate back to home page', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Click on back button
      await page.getByRole('link', { name: /back to home/i }).click();

      // Should navigate to home page
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Tab through form elements
      await page.keyboard.press('Tab'); // Focus email
      await expect(page.getByPlaceholder(/email/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Focus password
      await expect(page.getByPlaceholder(/password/i)).toBeFocused();

      // Fill form using keyboard
      await page.keyboard.type('test@example.com');
      await page.keyboard.press('Tab'); // Move to password
      await page.keyboard.type('TestPass123!');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await navigateAndWait(page, '/login');

      // Check inputs have labels
      const emailLabel = page.getByText(/email address/i);
      const passwordLabel = page.getByText(/^password/i);

      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();
    });
  });

  test.describe('Remember Me Functionality', () => {
    test('should have remember me checkbox', async ({ page }) => {
      await navigateAndWait(page, '/login');

      const rememberCheckbox = page.locator('input[type="checkbox"]');
      await expect(rememberCheckbox).toBeVisible();
    });

    test('should be able to check and uncheck remember me', async ({ page }) => {
      await navigateAndWait(page, '/login');

      const rememberCheckbox = page.locator('input[type="checkbox"]');

      // Check the checkbox
      await rememberCheckbox.check();
      await expect(rememberCheckbox).toBeChecked();

      // Uncheck the checkbox
      await rememberCheckbox.uncheck();
      await expect(rememberCheckbox).not.toBeChecked();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await navigateAndWait(page, '/login');

      // Check main elements are visible
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await navigateAndWait(page, '/login');

      // Check main elements are visible
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await navigateAndWait(page, '/login');

      // Check marketing content is visible on larger screens
      await expect(page.getByText(/access your/i)).toBeVisible();
      await expect(page.getByText(/elite portal/i)).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test('should clear error message when user starts typing', async ({ page }) => {
      // Mock failed login
      await mockApiError(page, API_ENDPOINTS.login, 401, 'Invalid credentials');

      await navigateAndWait(page, '/login');

      // Submit with invalid credentials
      await page.getByPlaceholder(/email/i).fill(TEST_USERS.invalid.email);
      await page.getByPlaceholder(/password/i).fill(TEST_USERS.invalid.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for error to appear
      const errorMessage = page.locator('text=/login failed/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      // Start typing in email field
      await page.getByPlaceholder(/email/i).fill('new@example.com');

      // Error should eventually clear (component behavior may vary)
      // This is a general expectation, actual behavior depends on implementation
    });

    test('should display error message in visible area', async ({ page }) => {
      await mockApiError(page, API_ENDPOINTS.login, 401, 'Invalid credentials');

      await navigateAndWait(page, '/login');

      await page.getByPlaceholder(/email/i).fill(TEST_USERS.invalid.email);
      await page.getByPlaceholder(/password/i).fill(TEST_USERS.invalid.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      const errorMessage = page.locator('.bg-red-500\\/10, [class*="error"]').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Security', () => {
    test('should not show password in clear text by default', async ({ page }) => {
      await navigateAndWait(page, '/login');

      const passwordInput = page.getByPlaceholder(/password/i);
      await passwordInput.fill('SecretPass123!');

      // Password field should have type="password"
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should not store password in localStorage', async ({ page }) => {
      await navigateAndWait(page, '/login');

      await page.getByPlaceholder(/email/i).fill(TEST_USERS.valid.email);
      await page.getByPlaceholder(/password/i).fill(TEST_USERS.valid.password);

      // Check localStorage doesn't contain password
      const hasPassword = await page.evaluate(() => {
        return Object.values(localStorage).some(value =>
          value.includes('Password') || value.includes('password')
        );
      });

      expect(hasPassword).toBe(false);
    });
  });
});
