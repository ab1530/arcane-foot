# Hardware Ingestion – Phase 1 (GPS vest)

## Prisma
- New model `HardwareSession` with flexible metrics (distance, sprint, speed, accel/decel, calories, offense/defense ratio, JSON blobs for thermal map, sprint vectors, motion trajectory, quality six-dimensional, raw/normalized metrics). Relation: `playerId -> players(id)`, indexed on `playerId` and `startedAt`.
- Migration: `backend/prisma/migrations/20251209000000_add_hardware_sessions/migration.sql`.
- Players now expose `hardware_sessions` relation. Seed adds 5 demo sessions (Haaland + Vinicius) via `prisma/seed.ts`.

## Backend endpoints (port 5001, prefix `/api`)
- POST `/hardware/sessions` — role PLAYER only, optional `playerId` (defaults to connected player). Validates dates, calculates `totalTimeMin` when missing. Returns session + player snapshot. Auth: Bearer.
- GET `/hardware/sessions/player/:playerId` — roles PLAYER/ADMIN/SCOUT/ANALYST/AGENT/SUPER_ADMIN/CLUB_CONTACT (players limited to their own data). Returns sessions ordered by `startedAt` desc.
- GET `/hardware/sessions/:sessionId` — same roles, player ownership enforced. Returns full metrics + player info.
- Swagger tag: **Hardware** (available in `/api/docs`).

Example POST payload:
```json
{
  "deviceId": "gps-vest-101",
  "source": "nashone_v1",
  "type": "training",
  "startedAt": "2025-02-14T09:00:00Z",
  "endedAt": "2025-02-14T10:15:00Z",
  "metrics": {
    "movementDistanceM": 10250,
    "sprintDistanceM": 1150,
    "avgSpeedKmh": 22.3,
    "maxSpeedKmh": 34.1,
    "sprintCount": 19,
    "caloriesBurned": 1180,
    "maxAccelerationG": 3.1,
    "maxDecelerationG": 3.3,
    "accelerationCount": 44,
    "reductionStepsCount": 18,
    "thermalTrajectoryMap": { "zones": ["left_wing", "half_spaces"], "intensity": "high" },
    "rawMetrics": { "battery": 82 }
  }
}
```

## Web (Arcane DS 2.0)
- New tab on player profile via `PlayerTabs` (overview + “Performance GPS”).
- Page: `web/src/app/players/[id]/hardware/page.tsx` — fetches `/hardware/sessions/player/:playerId` with `apiClient`, shows premium cards, distance/sprint chart, last-session highlight, and detailed list (distance, sprint, max speed, sprints, duration, calories/accels).
- API client additions in `web/src/lib/api-client.ts` and types `web/src/types/hardware.ts`.

## Mobile
- Screens:
  - `mobile/src/screens/hardware/PlayerHardwareSessionsScreen.tsx`: lists sessions, summary cards, “Simuler une nouvelle séance GPS” (random realistic payload -> POST) then refreshes list.
  - `mobile/src/screens/hardware/PlayerHardwareSessionDetailScreen.tsx`: fetches `/hardware/sessions/:id`, shows metrics (distance, sprint, max speed, sprintCount, duration, calories, accel/decel) + mini bar chart.
- Navigation: added to `AppNavigator` and `AppStackParamList` as `HardwareSessions` and `HardwareSessionDetail`.
- Entry point: Profile/Hub button “Mes stats GPS” (guards non-player with toast) opens sessions.
- Mobile API methods in `mobile/src/services/api.ts`, types in `mobile/src/types/hardware.ts`.

## Testing
- Backend: run API on `http://localhost:5001`, check Swagger tag “Hardware”. Quick checks:
  - `curl -H "Authorization: Bearer <token>" http://localhost:5001/api/hardware/sessions/player/<playerId>`
  - `curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '<payload>' http://localhost:5001/api/hardware/sessions`
- Web: go to `/players/{id}` -> tab “Performance GPS” for list + chart.
- Mobile: Profile -> “Mes stats GPS” -> simulate session -> detail screen for metrics/mini-chart. Refresh via pull-to-refresh.
