import { expect, Page } from '@playwright/test';

export const languageToggleSelector = '[data-test="language-toggle"]';

const mockedAuthUser = {
  id: 'qa-user',
  email: 'qa@arcane.ai',
  firstName: 'QA',
  lastName: 'Lead',
  role: 'PLAYER',
};

const mockedStoredUser = {
  id: 'qa-user',
  email: 'qa@arcane.ai',
  fullName: 'QA Lead',
  accountType: 'player',
};

const mockedProSubscription = {
  id: 'qa-subscription',
  tier: 'PRO',
  status: 'ACTIVE',
};

export async function mockAuthenticatedProAccess(page: Page) {
  await page.addInitScript(({ user }) => {
    window.localStorage.setItem('arcane_auth_token', 'playwright-token');
    window.localStorage.setItem('arcane_user', JSON.stringify(user));
  }, { user: mockedStoredUser });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(mockedAuthUser),
    });
  });

  await page.route('**/api/subscriptions/me', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(mockedProSubscription),
    });
  });
}

export async function gotoAndWait(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // networkidle can fail on streaming pages; fallback silently
  }
  await page.waitForTimeout(200);
}

export async function setLanguage(page: Page, lang: 'fr' | 'en') {
  await gotoAndWait(page, '/');
  const toggle = page.locator(languageToggleSelector);
  if (await toggle.count()) {
    await toggle.selectOption(lang);
    await page.waitForTimeout(150);
  } else {
    await page.evaluate((language) => {
      localStorage.setItem('arcane.language', language);
    }, lang);
  }
}

export async function verifyTranslations(
  page: Page,
  args: { url: string; selector: string; fr: string; en: string },
) {
  const locator = page.locator(args.selector);

  await setLanguage(page, 'fr');
  await gotoAndWait(page, args.url);
  await locator.first().waitFor({ state: 'visible', timeout: 10000 });
  await expect(locator).toHaveText(args.fr, { timeout: 10000 });

  await setLanguage(page, 'en');
  await gotoAndWait(page, args.url);
  await locator.first().waitFor({ state: 'visible', timeout: 10000 });
  await expect(locator).toHaveText(args.en, { timeout: 10000 });
}
