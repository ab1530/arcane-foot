## Mobile / Web Parity Master Plan

This document tracks the end-to-end alignment between the **React Native + Expo** app (`/mobile`) and the **Next.js** client (`/web`).  
Each phase lists the concrete actions so that future work is never “forgotten”.

---

### Phase 1 – Foundations _(in progress)_

- [x] Update top-level documentation to mention the React Native stack (`README.md`, `START_HERE.md`).
- [x] Publish shared design tokens file that can be consumed by web (Tailwind) and mobile (Arcane DS).
- [x] Finalise AuthContext adoption and remove/deprecate the old Zustand `authStore`.
- [x] Document development workflows for running backend + web + mobile simultaneously.

### Phase 2 – Navigation & Discoverability

- [x] Redesign `MainTabNavigator` to expose AI, Marketplace, Coaching, Passport hubs.
- [x] Add in-app entry points (Command Center + header buttons) vers les écrans stack (Players, Analytics, Matches, Reports, Voice-to-Report).
- [ ] Define feature flags to hide unfinished sections without removing routes.
- [ ] Provide a UX map mirroring the Next.js IA.

### Phase 3 – API Integration

- [ ] Audit all methods in `mobile/src/services/api.ts` vs `BACKEND_API_ENDPOINTS.json`.
- [ ] Implement missing calls (coaching sessions, gamification stats, passport data, auto-scout, market value, notifications).
- [ ] Introduce caching/data fetching strategy (React Query or improved Zustand slices) per feature.
- [ ] Ensure error handling + toast messaging matches the web experience.

### Phase 4 – UX Harmonisation

- [ ] Apply the Arcane 2.0 design system to legacy screens that still import `src/constants/theme.ts`.
- [ ] Align component variants (buttons, cards, inputs) with the web counterparts.
- [ ] Share illustration/asset usage guidelines (glass/glow, gradients, typography scale).
- [ ] Remove deprecated constants (`constants/config.ts` colors, spacing duplicates) after migration.

### Phase 5 – QA & Demo Readiness

- [ ] Expand Jest/Testing Library coverage for navigation, AI flows, coaching, passport, gamification.
- [ ] Update `README_DEMO.md`, `CHECKLIST_PRE_DEMO.md`, and `DEMO_GUIDE.md` to include the mobile flow.
- [ ] Validate feature parity using existing checklists (`QA_AGENTS_*`, `CHECKLIST_PRE_DEMO.md`).
- [ ] Coordinate release notes + screenshots for app stores.

> Keep this file updated as tasks move forward so every contributor knows what remains.
