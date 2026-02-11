import { expect, Page } from '@playwright/test';

export const languageToggleSelector = '[data-test="language-toggle"]';

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
