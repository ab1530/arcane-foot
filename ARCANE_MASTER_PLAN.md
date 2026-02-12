# ARCANE MASTER PLAN

## Vision
Stabiliser Arcane (Backend NestJS + Web Next.js + Mobile Expo + IA FastAPI + Supabase) pour atteindre un état "Demo Ready" sans mocks ni erreurs critiques, avec des rôles cohérents et des intégrations alignées.

## Synthèse Audit
- Alignement API/UI incomplet (gamification, auto-scout, voice, notifications, passport, validation, Supabase).
- Rôles/canaux non synchronisés entre backend, web, mobile ; pages privées non protégées.
- Web instable (React Query absent globalement, dashboards mockés, endpoints manquants).
- Mobile partiellement connecté (endpoints erronés, notifications, rôles, dossiers fantômes).
- Backend nécessite persistance notifications, fallback Supabase, pagination et endpoints dédiés.
- Tests automatiques et scénarios démo inexistants.

## Roadmap
1. **Phase 1 – Alignement API/UI & endpoints critiques**
   - Gamification web <-> backend
   - Passport mobile + auth update
   - Notifications mobile + backend fallback/persistance minimale
   - Validation service URL correcte
   - Supabase optionnel/fallback
   - Auto-Scout regenerate implémenté
   - Voice-to-report fallback sans OpenAI
2. **Phase 2 – Rôles & Permissions**
   - Créer `roles.config.ts` partagé
   - Harmoniser Auth contexts + navigation web/mobile
   - S’assurer que backend applique les mêmes rôles
3. **Phase 3 – Web Stability & Protection**
   - QueryClient global, ProtectedRoute, useSubscriptionGuard
   - Retrait des mocks (dashboards admin/scout, services)
   - Endpoint `/dashboard/stats` et consommation SSR/CSR
4. **Phase 4 – Mobile Stability**
   - Vérification endpoints, notifications, roles, nettoyage dossiers
   - Vérifier logging engine / feature flags
5. **Phase 5 – Backend Solidification**
   - Notifications persistantes (Prisma)
   - Supabase module cleanup + overrides ENV
   - Pagination standard + cache Redis fallback
   - Endpoint `/dashboard/stats`
6. **Phase 6 – Supabase Integration (optionnel)**
   - Buckets médias, upload aligné web/mobile
7. **Phase 7 – Tests automatisés + Agent**
   - Script multi-rôles qui exécute actions, log et corrige
8. **Phase 8 – Demo-ready Polish**
   - UI polish web/mobile, scénarios démo, doc finale

## Checkpoints
- `CHECKPOINT_PHASE_1`
- `CHECKPOINT_PHASE_2`
- `CHECKPOINT_PHASE_3`
- `CHECKPOINT_PHASE_4`
- `CHECKPOINT_PHASE_5`
- `CHECKPOINT_PHASE_6`
- `CHECKPOINT_PHASE_7`
- `CHECKPOINT_PHASE_8`

## Testing Requirements
- À chaque phase: lint backend, tests ciblés API, vérifs SSR/CSR web, tests Expo/CLI côté mobile.
- Phase 7: agent automatisé multi-rôles.

## Documents liés
- ARCANE_PROGRESS.md
- ARCANE_CHANGELOG.md
