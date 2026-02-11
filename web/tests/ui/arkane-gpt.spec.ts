import { test, expect } from '@playwright/test';
import { gotoAndWait, setLanguage } from './utils/language';

const arkaneGptUrl = '/ai/arkane-gpt';

test.describe('Arkane GPT suggestions translations', () => {
  test('Suggested questions and warnings switch language', async ({ page }) => {
    await setLanguage(page, 'fr');
    await gotoAndWait(page, arkaneGptUrl);
    await expect(page.locator('[data-test="arkane-gpt-suggestions-title"]')).toHaveText('Questions suggérées');
    await expect(page.locator('[data-test="arkane-gpt-input-warning"]')).toHaveText(
      "ArkaneGPT peut se tromper. Vérifiez les informations importantes.",
    );

    await setLanguage(page, 'en');
    await gotoAndWait(page, arkaneGptUrl);
    await expect(page.locator('[data-test="arkane-gpt-suggestions-title"]')).toHaveText('Suggested questions');
    await expect(page.locator('[data-test="arkane-gpt-input-warning"]')).toHaveText(
      'ArkaneGPT may make mistakes. Double-check important information.',
    );
  });
});
