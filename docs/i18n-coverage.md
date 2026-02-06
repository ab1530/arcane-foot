# Cartographie i18n & QA

| Page / URL | Racine dictionnaire | Hooks `data-test` | Scénario Playwright |
| --- | --- | --- | --- |
| `/contact` | `dictionary.contact` | `contact-hero-title`, `contact-global-title` | `language-toggle.spec.ts` – “Contact page updates copy…” |
| `/ai` (Hub) | `dictionary.aiHub` | `ai-hero-badge-text`, `ai-hero-title` | `language-toggle.spec.ts` – “AI Hub hero updates copy…” |
| `/ai/arkane-scout` | `dictionary.aiTools.scout` | `arkane-scout-hero-badge`, `arkane-scout-hero-title`, `arkane-scout-hero-description`, `arkane-scout-primary-cta`, `arkane-scout-secondary-cta` | `language-toggle.spec.ts` – Arkane Scout hero + navigation CTA |
| `/ai/arkane-index` | `dictionary.aiTools.index` | ✅ `arkane-index-hero-title`, `arkane-index-hero-subtitle`, `arkane-index-hero-badge-title`<br/>⏳ `arkane-index-score-title`, `arkane-index-score-physical`, `arkane-index-score-technical`, `arkane-index-score-mental`, `arkane-index-score-tactical`<br/>⏳ `arkane-index-cta-title`, `arkane-index-cta-description`, `arkane-index-cta-primary`, `arkane-index-cta-secondary`<br/>⏳ `arkane-index-features-title` | ✅ `language-toggle.spec.ts` – Arkane Index hero & badge<br/>⏳ Score card sections (skipped - needs data-test attributes)<br/>⏳ CTA section (skipped - needs data-test attributes)<br/>⏳ Features grid (skipped - needs data-test attributes) |
| `/ai/arkane-gpt` | `dictionary.aiTools.gpt.header` | `arkane-gpt-header-title`, `arkane-gpt-header-subtitle`, `arkane-gpt-header-status` | `language-toggle.spec.ts` – Arkane GPT header |
| `/services` | `dictionary.servicesPage` | `services-nav-cta`, `services-hero-badge`, `services-hero-title`, `services-hero-description`, `services-process-subtitle`, `services-cta-membership` | `language-toggle.spec.ts` – hero/nav/process/CTA |
| `/reports/templates` | `dictionary.aiTools.scout.templates` | `reports-templates-badge`, `reports-templates-title`, `reports-templates-description` | `language-toggle.spec.ts` – hero/description · `reports-language.spec.ts` – badge copy |
| `/dashboard` | `dictionary.dashboard.header` | `dashboard-header-title`, `dashboard-header-subtitle` | `language-toggle.spec.ts` – Dashboard header |
| `/reports` | `dictionary.reports` | `reports-hero-title`, `reports-hero-subtitle` | `reports-language.spec.ts` – “Reports hero updates copy…” |
| `/auto-scout` | `dictionary.autoScout` | `auto-scout-hero-title`, `auto-scout-hero-description` | `reports-language.spec.ts` – “AutoScout hero updates copy…” |

## État actuel des tests Playwright (2025-11-13)

### ✅ Tests passants (18/18 actifs)
- Tous les tests de `language-toggle.spec.ts` passent avec succès
- Les tests d'i18n pour contact, AI Hub, Arkane Scout, Arkane GPT, reports, services fonctionnent
- Temps d'exécution total : ~2.9 minutes avec 5 workers parallèles

### ⏳ Tests en attente (4 skipped)
Les tests suivants pour Arkane Index sont écrits mais désactivés (`test.skip`) car les attributs `data-test` ne sont pas encore implémentés :
1. **Score card title** : `arkane-index-score-title`
2. **Score card sections** : `arkane-index-score-physical`, `arkane-index-score-technical`, `arkane-index-score-mental`, `arkane-index-score-tactical`
3. **CTA section** : `arkane-index-cta-title`, `arkane-index-cta-description`, `arkane-index-cta-primary`, `arkane-index-cta-secondary`
4. **Features grid** : `arkane-index-features-title`

### Configuration mise à jour
- ✅ Timeout des tests augmenté à 60 secondes
- ✅ `reuseExistingServer: true` pour utiliser le serveur dev existant
- ✅ Serveur Next.js doit être démarré avant l'exécution des tests

## Prochaines étapes web

- **Priorité 1** : Ajouter les attributs `data-test` manquants sur la page `/ai/arkane-index` pour activer les 4 tests skippés
- **Priorité 2** : `/ai/arkane-gpt` (empty states chat) reste à sécuriser côté dico/tests
- **Priorité 3** : Ajouter un scénario Playwright dédié à `/reports/templates` (CTA secondaires) pour compléter le parcours IA

## Rappel mobile

- `AutoScoutHistoryScreen` consomme désormais `dictionary.autoScout.history` + API live et possède un test RTL (`AutoScoutHistoryScreen.test.tsx`) qui couvre la bascule FR/EN + l’erreur “aucun joueur”.
- `ArcaneIndexScreen` est branché sur `dictionary.aiTools.index` et dispose d’un test RTL dédié (`ArcaneIndexScreen.test.tsx`) pour vérifier les libellés FR/EN.
- `AutoScoutScreen` utilise maintenant `dictionary.autoScout.wizard` sur l’ensemble du flux (template → preview) et est couvert par `AutoScoutScreen.test.tsx` (cas FR + dépassement quota).

## Suites à prioriser

1. Étendre `language-toggle.spec.ts` aux sections secondaires d’`/ai/arkane-index` et `/ai/arkane-gpt` (badges, empty states) pour verrouiller les écrans IA web.
2. Préparer un Playwright dédié `/services` → `/reports/templates` afin de sécuriser l’entonnoir commercial complet en FR/EN.
3. Côté mobile, prévoir un test Detox ou un scénario RTL supplémentaire sur l’historique AutoScout (suppression/export) pour couvrir les erreurs API restantes.
