# ARCANE CHANGELOG

## [Unreleased]
- Initial master plan + progress tracking files created (Phase 1 preparation).
- Auto-Scout template fallback now handles missing player metadata and penalizes incomplete stats to satisfy edge-case tests.
- Web gamification API client/hooks switched to direct `/gamification` backend routes with data mapping for leaderboards, challenges, and XP.
- Passport backend exposes `/passport/me` so mobile flows can fetch the authenticated player's passport without custom queries.
- `ProtectedRoute` now wraps the new `ProtectedPage` guard so all legacy protected screens inherit consistent redirects and loading states.
- SmartScout, Performance Predictor, and PlayStyle DNA now use `ProtectedPage` + `RequireTier(PRO)` while Profile is protected via `ProtectedPage`, keeping AI flows premium-only and preventing anonymous access.
- AI Hub feature buttons call `useSubscriptionGuard` before navigation, showing the upgrade modal (and blocking navigation) when the subscription tier is insufficient.
- Every private section that previously used `<ProtectedRoute>` (players, reports, marketplace, calendar, analytics, favorites, etc.) now imports `<ProtectedPage>` directly, which removes the redundant wrapper component and ensures identical guard behaviour across the app shell.
