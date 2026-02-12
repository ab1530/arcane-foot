import { test, expect } from '@playwright/test';
import {
  gotoAndWait,
  mockAuthenticatedProAccess,
  setLanguage,
  verifyTranslations,
} from './utils/language';

const contactUrl = '/contact';
const aiHubUrl = '/ai';
const arkaneScoutUrl = '/ai/arkane-scout';
const arkaneIndexUrl = '/ai/arkane-index';
const arkaneGptUrl = '/ai/arkane-gpt';
const reportsTemplatesUrl = '/reports/templates';
const dashboardUrl = '/dashboard';
const servicesUrl = '/services';

test.describe('Language toggle smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedProAccess(page);
  });

  test('Contact page updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: contactUrl,
      selector: '[data-test="contact-hero-title"]',
      fr: 'Contactez-nous',
      en: 'Contact us',
    });
  });

  test('AI Hub hero updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: aiHubUrl,
      selector: '[data-test="ai-hero-badge-text"]',
      fr: 'Intelligence artificielle',
      en: 'Artificial intelligence',
    });
  });

  test('Arkane Scout hero updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: arkaneScoutUrl,
      selector: '[data-test="arkane-scout-hero-description"]',
      fr: 'Automatisez la rédaction de rapports professionnels en combinant vos données vidéo, statistiques avancées et recommandations IA.',
      en: 'Automate professional scouting reports by combining your video, advanced data and Arkane recommendations.',
    });
  });

  test('Arkane Index hero updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: arkaneIndexUrl,
      selector: '[data-test="arkane-index-hero-subtitle"]',
      fr: 'Système de notation IA ultra-précis',
      en: 'Ultra-precise AI rating system',
    });
  });

  test('Arkane Index badge updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: arkaneIndexUrl,
      selector: '[data-test="arkane-index-hero-badge-title"]',
      fr: "L'algorithme le plus avancé du football",
      en: 'The most advanced algorithm in football',
    });
  });

  test('Reports templates header updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: reportsTemplatesUrl,
      selector: '[data-test="reports-templates-title"]',
      fr: 'Modèles prêts à l’emploi',
      en: 'Ready-to-use templates',
    });
  });

  test('Arkane GPT header updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: arkaneGptUrl,
      selector: '[data-test="arkane-gpt-header-subtitle"]',
      fr: 'Assistant IA spécialisé football',
      en: 'Football-specialized AI assistant',
    });
  });

  test('Arkane GPT suggestions title updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: arkaneGptUrl,
      selector: '[data-test="arkane-gpt-suggestions-title"]',
      fr: 'Questions suggérées',
      en: 'Suggested questions',
    });
  });

  test('Arkane GPT warning updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: arkaneGptUrl,
      selector: '[data-test="arkane-gpt-input-warning"]',
      fr: 'ArkaneGPT peut se tromper. Vérifiez les informations importantes.',
      en: 'ArkaneGPT may make mistakes. Double-check important information.',
    });
  });

  test('Dashboard header updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: dashboardUrl,
      selector: '[data-test="dashboard-header-title"]',
      fr: 'Tableau de bord',
      en: 'Dashboard',
    });
  });

  test('Arkane Scout CTAs navigate to reports routes', async ({ page }) => {
    await setLanguage(page, 'fr');
    await gotoAndWait(page, arkaneScoutUrl);
    await page.locator('[data-test="arkane-scout-primary-cta"]').click();
    await page.waitForURL('**/reports');
    await expect(page).toHaveURL(/\/reports$/);

    await gotoAndWait(page, arkaneScoutUrl);
    await page.locator('[data-test="arkane-scout-secondary-cta"]').click();
    await page.waitForURL('**/reports/templates');
    await expect(page).toHaveURL(/\/reports\/templates$/);
  });

  test('Services hero updates copy when switching languages', async ({ page }) => {
    await setLanguage(page, 'fr');
    await gotoAndWait(page, servicesUrl);
    await expect(page.locator('[data-test="services-hero-title"]')).toHaveText('Nos services');
    await expect(page.locator('[data-test="services-hero-description"]')).toHaveText(
      'Des solutions complètes pour la représentation footballistique moderne.',
    );
    await expect(page.locator('[data-test="services-nav-cta"]')).toHaveText('Nous contacter');
    await expect(page.locator('[data-test="services-process-subtitle"]')).toHaveText(
      'Notre méthode pour démarrer rapidement',
    );
    await expect(page.locator('[data-test="services-cta-membership"]')).toHaveText(
      'Voir les offres',
    );

    await setLanguage(page, 'en');
    await gotoAndWait(page, servicesUrl);
    await expect(page.locator('[data-test="services-hero-title"]')).toHaveText('Our services');
    await expect(page.locator('[data-test="services-hero-description"]')).toHaveText(
      'Comprehensive solutions for modern football representation.',
    );
    await expect(page.locator('[data-test="services-nav-cta"]')).toHaveText('Contact us');
    await expect(page.locator('[data-test="services-process-subtitle"]')).toHaveText(
      'Our streamlined process to get you started',
    );
    await expect(page.locator('[data-test="services-cta-membership"]')).toHaveText(
      'View membership plans',
    );
  });

  // TODO: Add these data-test attributes to the Arkane Index page components:
  // - arkane-index-score-title
  // - arkane-index-score-physical
  // - arkane-index-score-technical
  // - arkane-index-score-mental
  // - arkane-index-score-tactical
  // - arkane-index-cta-title
  // - arkane-index-cta-description
  // - arkane-index-cta-primary
  // - arkane-index-cta-secondary
  // - arkane-index-features-title

  test.skip('Arkane Index score card updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: arkaneIndexUrl,
      selector: '[data-test="arkane-index-score-title"]',
      fr: 'Score global',
      en: 'Overall score',
    });
  });

  test.skip('Arkane Index score card sections update when switching languages', async ({ page }) => {
    await setLanguage(page, 'fr');
    await gotoAndWait(page, arkaneIndexUrl);

    // Check French translations for score card sections
    await expect(page.locator('[data-test="arkane-index-score-physical"]')).toHaveText('Physique');
    await expect(page.locator('[data-test="arkane-index-score-technical"]')).toHaveText('Technique');
    await expect(page.locator('[data-test="arkane-index-score-mental"]')).toHaveText('Mental');
    await expect(page.locator('[data-test="arkane-index-score-tactical"]')).toHaveText('Tactique');

    await setLanguage(page, 'en');
    await gotoAndWait(page, arkaneIndexUrl);

    // Check English translations for score card sections
    await expect(page.locator('[data-test="arkane-index-score-physical"]')).toHaveText('Physical');
    await expect(page.locator('[data-test="arkane-index-score-technical"]')).toHaveText('Technical');
    await expect(page.locator('[data-test="arkane-index-score-mental"]')).toHaveText('Mental');
    await expect(page.locator('[data-test="arkane-index-score-tactical"]')).toHaveText('Tactical');
  });

  test.skip('Arkane Index CTA section updates copy when switching languages', async ({ page }) => {
    await setLanguage(page, 'fr');
    await gotoAndWait(page, arkaneIndexUrl);

    // Check French CTA translations
    await expect(page.locator('[data-test="arkane-index-cta-title"]')).toHaveText('Prêt à révolutionner votre analyse ?');
    await expect(page.locator('[data-test="arkane-index-cta-description"]')).toHaveText(
      'Découvrez comment Arkane Index peut transformer votre approche du scouting.'
    );
    await expect(page.locator('[data-test="arkane-index-cta-primary"]')).toHaveText('Commencer maintenant');
    await expect(page.locator('[data-test="arkane-index-cta-secondary"]')).toHaveText('En savoir plus');

    await setLanguage(page, 'en');
    await gotoAndWait(page, arkaneIndexUrl);

    // Check English CTA translations
    await expect(page.locator('[data-test="arkane-index-cta-title"]')).toHaveText('Ready to revolutionize your analysis?');
    await expect(page.locator('[data-test="arkane-index-cta-description"]')).toHaveText(
      'Discover how Arkane Index can transform your scouting approach.'
    );
    await expect(page.locator('[data-test="arkane-index-cta-primary"]')).toHaveText('Get started');
    await expect(page.locator('[data-test="arkane-index-cta-secondary"]')).toHaveText('Learn more');
  });

  test.skip('Arkane Index features grid updates copy when switching languages', async ({ page }) => {
    await verifyTranslations(page, {
      url: arkaneIndexUrl,
      selector: '[data-test="arkane-index-features-title"]',
      fr: 'Fonctionnalités avancées',
      en: 'Advanced features',
    });
  });
});
