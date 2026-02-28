# Calendar Mission Workflow V1 (Sans Google/Apple/Outlook)

## Objectif Produit
- Le calendrier est le centre de coordination entre `AGENT`, `SCOUT`, `ADMIN`.
- V1 livre le flux mission/report complet sans synchronisation externe.
- La synchronisation Google/Apple/Outlook est explicitement hors scope V1.

## Rôles Et Permissions (Métier)
| Capability | PLAYER | SCOUT | AGENT | ADMIN / SUPER_ADMIN |
|---|---|---|---|---|
| Lire calendrier partagé | Lecture limitée (événements joueur) | Oui | Oui | Oui |
| Ajouter un match à mon calendrier | Non | Oui (`VOLUNTARY`) | Non | Non |
| Démarrer / terminer mission | Non | Oui (mission assignée à lui) | Non | Non |
| Créer une demande de mission | Non | Non | Oui | Oui |
| Lire demandes de mission | Non | Oui (ciblées sur lui) | Oui (créées par lui) | Oui (toutes) |
| Approuver / rejeter demande | Non | Non | Non | Oui |
| Annuler demande | Non | Non | Oui (propriétaire) | Oui |
| Soumettre rapport scout | Non | Oui | Non | Non |
| Lire rapports soumis | Non | Propriétaire + scope autorisé | Oui (règles visibilité) | Oui |

## Matrice Endpoint -> Rôles
| Endpoint | SCOUT | AGENT | ADMIN | PLAYER | Notes |
|---|---|---|---|---|---|
| `GET /matches/scout-calendar` | Oui | Non | Non | Non | Feed scout: `myCalendar`, `sharedCalendar`, `discover` |
| `POST /matches/:id/my-calendar` | Oui | Non | Non | Non | Crée/maj assignment `VOLUNTARY` |
| `PATCH /match-assignments/:id/start` | Oui (owner) | Non | Non | Non | Check-in mission |
| `PATCH /match-assignments/:id/complete` | Oui (owner) | Non | Non | Non | Check-out mission |
| `GET /matches/my-assignments` | Oui | Non | Non | Non | Liste missions d’un scout |
| `POST /matches/:id/mission-requests` | Non | Oui | Oui | Non | Créer une demande (target scout optionnel) |
| `GET /matches/mission-requests` | Oui (scope limité) | Oui (scope limité) | Oui | Non | Filtre `status` |
| `GET /matches/:id/mission-requests` | Oui (scope limité) | Oui (scope limité) | Oui | Non | Filtre par match |
| `PATCH /matches/mission-requests/:id/approve` | Non | Non | Oui | Non | Crée/maj assignment mission |
| `PATCH /matches/mission-requests/:id/reject` | Non | Non | Oui | Non | Clôture en `REJECTED` |
| `PATCH /matches/mission-requests/:id/cancel` | Non | Oui (owner) | Oui | Non | Clôture en `CANCELLED` |
| `GET /scouting-reports` | Oui | Oui (règles visibilité) | Oui | Non | Rapports enrichis + mission context |
| `POST /scouting-reports` | Oui | Non | Non | Non | Soumission simple |
| `POST /scouting-reports/bulk-submit` | Oui | Non | Non | Non | Soumission multi-joueurs |

## Statuts Et Cycle
### Mission request status
- `SUBMITTED`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

### Mission execution status (assignment)
- `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED`
- Mapping mobile: `PLANNED` -> `EN_ROUTE` -> `REPORT_SUBMITTED`

## Flux V1 (Décisionnel Complet)
1. Agent/Admin crée `mission-request`.
2. Admin décide `approve/reject`.
3. Si `approve`, création (ou mise à jour) de l’assignment du scout.
4. Scout voit la mission dans son calendrier et fait `check-in/check-out`.
5. Scout soumet rapport (`single` ou `bulk`).
6. Rapport visible selon règles mission + rôle.

## Contrat UI Mobile
- `CalendarScreenNew`: vues `my/shared/discover`, filtres pays/ligue/status.
- `MatchDetailScreen`:
  - actions mission scout,
  - panneau demandes de mission (create/approve/reject/cancel selon rôle).
- `CreateReportScreen`:
  - flow match -> joueur -> rapport,
  - soumission API,
  - feedback final.

## Compatibilité DB (Railway)
- Si migrations manquantes (`missionType` sur `match_assignments`, identité observée sur `scouting_reports`), le backend passe en mode legacy/fallback pour éviter les 500 sur lecture.
- Pour activer toutes les fonctions mission/report enrichies, exécuter:
  - `npx prisma migrate deploy`
