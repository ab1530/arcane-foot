# Execution TODO (Auto)

## 0) Setup & MCP
- [x] Generate OpenAPI spec from BACKEND_API_ENDPOINTS.json (`openapi-spec.json`).
- [ ] Stabilize Project MCP handshake (ensure quiet stdout or use alt server if needed).
- [ ] Validate Puppeteer MCP (download Chromium if needed) and define base URL for UX/E2E.

## 1) Database & Security (Supabase)
- [x] Fix `supabase/policies.sql` to match actual schema (camelCase + table names).
- [x] Apply RLS migration to Supabase.
- [ ] Add RLS policies for remaining public tables not yet covered (ex: clubs, matches, marketplace_*, media access variants).
- [x] Create Storage buckets (media, avatars, reports, camps).
- [x] Define Storage access policies (service role + user folder access).

## 2) Backend (critical TODOs)
- [x] Marketplace: implement matching score when requirements exist.
- [x] Marketplace: send notifications on offer create/accept.
- [x] Performance predictor: compute opponent_strength (from league table or match data).
- [x] Gamification: add missing user_stats fields (assistsMade, playersRejected, talentsDiscovered).
- [x] Apply DB migration for user_stats fields.

## 3) Web
- [x] Contact form → API integration + spam protection.
- [x] Marketplace scout “Send Offer” → modal or route + API call.
- [x] Notifications popover → link to full notifications page (route needed).
- [x] Add missing data-test attributes for Arkane Index i18n tests.

## 4) Mobile
- [ ] Coaching screens (BookSession, FilterModal, ReviewModal) real flow.
- [ ] Voice-to-report audio: expo-av permissions + record/playback.
- [ ] Camps screens: replace mock data + connect API (list/detail/my camps).
- [ ] Charts: migrate victory-native v41+ (TrendChart, DNARadarChart).
- [ ] Enable Sentry once DSN available.

## 5) QA/Tests
- [ ] Re-enable i18n tests once selectors added.
- [ ] Add minimal E2E flows (login → dashboard → reports).
