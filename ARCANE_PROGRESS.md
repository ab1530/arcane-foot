# ARCANE PROGRESS LOG

## Phase Overview
| Phase | Status | Notes |
| --- | --- | --- |
| Phase 1 – API/UI Alignment | COMPLETED | Endpoints aligned + UI checks done; ready for Phase 2 |
| Phase 2 – Roles & Permissions | COMPLETED | Shared roles config live on backend/web/mobile |
| Phase 3 – Web Stability & Protection | IN PROGRESS | Guards deployed on AI/private pages (SmartScout, Performance Predictor, PlayStyle DNA, Profile) |
| Phase 4 – Mobile Stability | NOT STARTED | |
| Phase 5 – Backend Solidification | NOT STARTED | |
| Phase 6 – Supabase Integration | NOT STARTED | Optional |
| Phase 7 – Automated Tests & Agent | NOT STARTED | |
| Phase 8 – Demo Polish | NOT STARTED | |

## Checkpoints
- CHECKPOINT_PHASE_1: validated (Phase 1 complete)
- CHECKPOINT_PHASE_2: validated (roles config shared + verified)

## Notes
- Audits consolidés et roadmap définie dans ARCANE_MASTER_PLAN.md.
- Auto-Scout fallback logic hardened, gamification client realigned with backend routes, mobile passport flow now backed by `/passport/me`.
- Next.js dev server boots cleanly (no build errors) après les mises à jour de gamification.
- Phase 2: `shared/config/roles.config.ts` adopté dans les trois plateformes + lint/tests verts (web & mobile).
- Phase 3 a démarré : `ProtectedRoute` délègue désormais à `ProtectedPage`, et les écrans AI premium (SmartScout, Performance Predictor, PlayStyle DNA) ainsi que le profil utilisateur sont tous protégés par authentification + tier PRO.
- AI Hub applique maintenant `useSubscriptionGuard` sur les CTA de fonctionnalités afin de déclencher automatiquement l’upgrade modal lorsqu’un rôle/tier insuffisant tente d’accéder aux outils IA.
- Toutes les pages privées (players, reports, marketplace, calendar, analytics, etc.) consomment directement `ProtectedPage`, supprimant l’ancien wrapper `ProtectedRoute` et uniformisant les redirections + fallbacks.
