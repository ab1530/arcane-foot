# HARDWARE_TEST_AGENT_PLAN.md

## 1. Overview
- Purpose: define how to validate the hardware/GPS feature end-to-end and ensure data sanity.
- Roles:
  - **HardwareFlowTester**: exercises the flow tracker → mobile → backend → web.
  - **HardwareDataValidator**: applies sanity/consistency rules on stored `HardwareSession` data.
- Scope: current implementation uses BLE stubs (mock device + synthetic sessions) but mirrors the real flow for later BLE enablement.

## 2. HardwareFlowTester (end-to-end flow)

### Preconditions
- Backend running at `http://localhost:5001` (API prefix `/api`).
- Mobile app configured to this backend.
- Web app pointing to the same backend.
- BLE currently stubbed in `actionTracerBle.ts` (mock device and sessions).

### Flow A – Import from tracker (stub) → visible in mobile & web
1) Mobile → “Mes séances GPS” (`PlayerHardwareSessionsScreen`).
2) Tap “Connecter mon GPS”.
3) On `ConnectGpsTrackerScreen`:
   - Tap “Scanner mon GPS”.
   - Select the mock device returned by the stub.
4) On `ImportGpsSessionScreen`:
   - Sessions appear (stubbed, state `completed`).
   - Tap “Importer” on one session.
5) Expect:
   - `syncDeviceFileToBackend` runs (mobile logs `[GPS][ACTION_TRACER] sync success`).
   - Navigation returns to `PlayerHardwareSessionsScreen`.
6) Mobile list: refresh; new session appears with distance/duration/speed > 0.
7) Web: open player page → “Performance GPS” tab; new session appears in list/charts.

### Flow B – Simulation vs Device data
1) Run simulation (“Simuler une nouvelle séance GPS”).
2) Import a session via BLE flow.
3) Verify both sessions coexist; sources/types remain consistent (simulation uses `mobile_simulator`, BLE uses `ACTION_MARK`).

### Flow C – API verification (optional/automated)
1) Call `GET /hardware/sessions/player/:playerId`.
2) Verify imported session is present with:
   - `metrics.movementDistanceM` > 0,
   - `metrics.motionTrajectoryData` present,
   - `rawMetrics` includes deviceFileId/sampleCount,
   - `normalizedMetrics` includes distance/speeds/duration.

## 3. HardwareDataValidator (data sanity rules)

| ID | Description | Severity | Rule / Threshold | Suggested remediation |
| --- | --- | --- | --- | --- |
| RULE-DISTANCE-RANGE | Distance out of plausible range | Warning/Error | 0 ≤ totalDistanceM ≤ 50,000 | Re-import; check mapping |
| RULE-DISTANCE-ZERO | Zero distance but duration > 0 | Warning | totalDistanceM == 0 && duration > 0 | Inspect trajectory; check device |
| RULE-SPEED-MAX | Max speed unrealistic | Error | maxSpeedKmh > 80 (likely bad); warning if > 45 | Flag as invalid; recalc |
| RULE-SPEED-AVG | Avg > Max | Error | avgSpeedKmh > maxSpeedKmh | Recompute metrics |
| RULE-DURATION-RANGE | Duration implausible | Warning/Error | 0 ≤ durationSeconds ≤ 3h | Check start/end timestamps |
| RULE-POINTS-DENSITY | Too few points for non-zero duration | Warning | points < 10 && duration > 0 | Verify download completeness |
| RULE-STATIC-TRAJ | All points identical but distance > 0 | Error | identical coords && distance > 0 | Recompute; inspect raw |
| RULE-TEMPORAL | Start after end or far future | Error | startedAt > endedAt OR endedAt >> now | Correct timestamps |
| RULE-MISSING-FIELDS | Device-specific nulls | Info | G-force/quality6D/heatmap missing for ActionMark | Document as “not provided” |

Notes:
- Thresholds are configurable; adjust for sport context.
- Do not flag absent fields (G-force, heatmap, quality6D) as errors for ActionMark v1.

## 4. How to implement these agents (high level)
- **HardwareFlowTester**:
  - Could be a Detox/Playwright suite driving mobile/web UI, or a script orchestrating mobile actions then querying backend/web.
  - Uses stubs now; later will rely on real BLE via `actionTracerBle` and decoder/mapping.
- **HardwareDataValidator**:
  - Could run as a backend cron or offline script pulling `/hardware/sessions` and applying the rules above.
  - Can be integrated into CI/QA pipelines to flag anomalous sessions.
- Both rely on:
  - `HARDWARE_GPS_MAPPING.md` for field semantics,
  - Shared types (`HardwareSession`, mobile/web hardware types),
  - Mobile decoder/mapping (`bleProtocol.ts`, `sessionMapping.ts`).

## 5. Manual QA checklist (for now)
- Mobile:
  - Access “Mes séances GPS”.
  - Simulate a session (button works, session appears).
  - Run “Connecter mon GPS” → “Importer une séance” → session appears.
- Backend:
  - `GET /hardware/sessions/player/:playerId` returns sessions including imported one.
- Web:
  - “Performance GPS” tab shows newly imported session with coherent metrics (distance/sprint/speed/duration).
