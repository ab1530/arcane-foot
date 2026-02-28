# Scout L7 - QA Report

Date: 2026-02-25

## Scope couvert
- L7 Profil scout mobile + rollout flags.
- Vérification ciblée backend guard voice certifié.
- Vérification ciblée mobile flags du flux scout.

## Résultats automatisés

### Backend
Commande:
`npm test -- --runInBand src/common/guards/scout-certification.guard.spec.ts src/modules/voice-to-report/voice-to-report.controller.spec.ts src/modules/players/players.controller.spec.ts src/modules/scouting-reports/scouting-reports.controller.spec.ts`

Résultat:
- 4 suites passées.
- 197 tests passés.
- 0 échec.

Couverture validée par ces tests:
- Guard `ScoutCertificationGuard`:
  - bypass via `VOICE_CERTIFIED_GUARD_ENABLED=false`,
  - refus non authentifié,
  - refus rôle non SCOUT,
  - refus scout non certifié (`currentLevel < 5`),
  - autorisation scout certifié (`currentLevel >= 5`).
- Endpoints voice/report/players/scouting-reports toujours opérationnels sur les specs ciblées.

### Mobile
Commande:
`npx jest src/constants/__tests__/features.test.ts src/screens/reports/__tests__/CreateReportScreen.test.tsx src/screens/dashboard/__tests__/DashboardScreen.test.tsx src/navigation/__tests__/RootNavigator.test.tsx --runInBand`

Résultat:
- 4 suites passées.
- 17 tests passés.
- 0 échec.

Couverture validée par ces tests:
- Parsing des flags:
  - `EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED`,
  - `EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED`.
- Flux création/envoi rapport mobile.
- Dashboard/navigation non régressés.

## Matrice L7 (QA)

1. `ScoutProfileScreen` (render + logique save/toggle): `PASS` (implémenté + non régression ciblée).
2. `VOICE_CERTIFIED_GUARD_ENABLED`: `PASS` (tests unitaires dédiés).
3. `EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED`: `PASS` (implémentation + test parser flag).
4. `EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED`: `PASS` (implémentation + test parser flag).
5. Smoke tests API ciblés (controller specs): `PASS`.
6. QA manuelle device/staging selon checklist: `PENDING`.

## Reste à exécuter (manuel)
- Vérifier sur device/staging:
  - visibilité/masquage entrée "Profil scout" selon flag,
  - édition complète du profil scout + persistance réelle backend,
  - activation/pause listing depuis UI,
  - rendu complet conforme maquette sur plusieurs tailles d'écran,
  - rollback opérationnel des flags en conditions réelles.
