# Roadmap de reprise client (Catégorie A / B)

## Phase 1 — Fondations RBAC (à faire ce soir)
- [x] Figer la définition des rôles Catégorie A / B dans le contrat partagé.
- [x] Normaliser la session utilisateur pour persister `role` de manière fiable.
- [x] Centraliser des helpers d’accès (allowed roles / categorie / route par rôle).
- [x] Ajouter un garde de route côté client (`ProtectedPage`/roles).
- [x] Protéger au minimum : `/admin/*` (catégorie A), `/scout` (scout).

### Vérification phase 1 (backend + mobile) — 20/02/2026
- [x] Harmoniser les contrôles `Catégorie A` côté backend (`ownership`, `media`, `analytics`, `player-profile`).
- [x] Vérifier les services mobile (`Dashboard`, `PlayerDetail`, `PlayerHighlights`) sans duplication `ADMIN || SUPER_ADMIN`.
- [x] Faire tourner les tests de régression ciblés:
  - `backend`: `common/roles`, `media`, `analytics`, `ownership`
  - `mobile`: `DashboardScreen` (+ test ciblés existants passés)

## Phase 2 — Phase Dashboard Scout
- [x] Refonte la home dashboard du scout avec 4 cartes demandées (phase mobile: métriques/labels; backend: endpoint consolidé).
- [x] Brancher `Rapports`, `Joueurs scoutés`, `Calendrier`, `Demandes`.
- [x] Vue agenda semaine/jour + actions Admin assignées (mobile + backend). Vérifiée le 20/02/2026.

## Phase 3 — Space joueur
- [x] Snapshot visuel joueur (temps de jeu, match, buts, blessure).
- [x] Diagrammes de performance + calendrier perso.
- [x] Formulaire hebdo de mise à jour post-week-end.
- [x] Exposer suivi santé + News Slater.

### Vérification phase 3 (backend + mobile) — 20/02/2026
- [x] Endpoint mobile + backend du dashboard joueur (`/players/me/space`, `/players/me/space/weekly-update`) implémentés et testés.
- [x] Tests ciblés passés:
  - `backend`: `players.controller.spec.ts`, `players.service.spec.ts`
  - `mobile`: `src/services/__tests__/api.test.ts`

## Phase 4 — Demandes à l’Agent + Marché/Profil
- [x] Créer le board dédié “Demandes à l’agent”.
- [x] Champs blessure / médical / équipement / autres besoins.
- [x] Règles marché configurables (italien, français, etc.) visibles + applicables.
- [x] Traçabilité des demandes (créées, en cours, satisfaites).

## Phase 5 — News
- [x] Ajouter onglet `News` (infos clubs, joueurs, marché, notifications importantes).
- [x] Ajouter flux temps réel + archivage simple.

## Phase 6 — UX / Dark Premium final
- [x] Refonte style global dark premium cohérente sur la section News (sections lisibles).
- [x] Réduction du temps perçu via animations d’état/progression (indicateur + cards animées).
- [x] Ajustements responsive desktop + mobile (1 à 2 colonnes selon écran).

### Vérification phase 6 (mobile) — 20/02/2026
- [x] Refonte visuelle et animations implémentées sur `NewsScreen`.
- [x] Indicateur de progression + skeleton premium pendant chargement.
- [x] Grille responsive adaptée desktop/mobile.
