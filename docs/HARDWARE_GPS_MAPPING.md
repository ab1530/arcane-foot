# HARDWARE_GPS_MAPPING.md

## 1. Overview
- ActionMark is a BLE GPS tracker. Arcane decodes low-level BLE packets and maps the data into the `HardwareSession` model via the mobile app.
- Layers:
  - Device protocol: file summary (0x51) and compressed GPS stream (0x42/0x43/0x48).
  - Mobile decoder: `mobile/src/services/hardware/bleProtocol.ts`.
  - Mobile mapping: `mobile/src/services/hardware/sessionMapping.ts`.
  - Backend storage: Prisma `HardwareSession` (see `backend/prisma/schema.prisma`) exposed via `/hardware/sessions`.

## 2. Device Data Structures (ActionMark)

### File summary (0x51 response to 0x30)
- Fields per entry (little-endian, 21 bytes): `StartDate(MMDD int32)`, `StartTime(ms of day UTC int32)`, `EndDate(MMDD int32)`, `EndTime(ms of day UTC int32)`, `Length(uint16)`, `ID(uint16)`, `Status(uint8)`.
- Status: bit7 (0x80) → extended length (+65536). Bits0-6: 0=not_started, 1=recording, 2=completed.

### Compressed GPS stream (0x42/0x43/0x48)
- Start of download: host sends `0x42 + FileID_L + FileID_H + Hz`.
- Data packets 0x43; transfer ends on 0x48.
- First 0x43 includes header: `RelativeStartTime(uint16, 0.1s)`, `AbsLatitude(int32)`, `AbsLongitude(int32)`.
- Delta pairs follow: `LatitudeDelta(int8)`, `LongitudeDelta(int8)`. Each delta → raw change = delta * 2; time step = 100 ms.
- Time jump: if `LatitudeDelta == -128`, treat `LongitudeDelta` as jumpCount; time += jumpCount * 100 ms; no point emitted.
- Coordinates: raw / 6_000_000 → degrees (range lat ±540000000, lon ±1080000000).

## 3. Decoded Types in Arcane (mobile)
- `DeviceFile`: `{ id, startDateMmdd, startTimeMsUtc, endDateMmdd, endTimeMsUtc, length, state }`.
- `GpsPoint`: `{ timeMsUtc, latitudeDeg, longitudeDeg }`.
- `parseFileSummaryPacket` → `DeviceFile[]` from 0x51.
- `decodeCompressedGpsStream` → `GpsPoint[]` from 0x43 chunks (stops on 0x48).

## 4. Mapping Device → HardwareSession fields

| Concept | Device / BLE field | Decoded field | HardwareSession / DTO field | Unit / transform | Notes |
| --- | --- | --- | --- | --- | --- |
| File ID | 0x51 ID | DeviceFile.id | metrics.rawMetrics.deviceFileId | integer | Used for traceability |
| Sample count | 0x51 Length (+65536 if ext) | DeviceFile.length | metrics.rawMetrics.sampleCount | integer | |
| Session start | startDateMmdd + startTimeMsUtc | DeviceFile start fields | startedAt (ISO) | `mmddAndMsOfDayToIso(year, mmdd, ms)` | year = current UTC year |
| Session end | endDateMmdd + endTimeMsUtc | DeviceFile end fields | endedAt (ISO) | same as above | |
| Trajectory | 0x43 stream | GpsPoint[] | metrics.motionTrajectoryData | raw list stored as `{points:[{t,lat,lon}]}` | From `decodeCompressedGpsStream` |
| Total distance | Haversine over GpsPoint[] | TrajectoryMetrics.totalDistanceM | metrics.movementDistanceM | meters | Computed in `computeTrajectoryMetrics` |
| Duration | last.time - first.time | TrajectoryMetrics.durationSeconds | metrics.totalTimeMin | seconds → minutes | |
| Max speed | segment max | TrajectoryMetrics.maxSpeedKmh | metrics.maxSpeedKmh | km/h | |
| Avg speed | totalDistance / duration | TrajectoryMetrics.avgSpeedKmh | metrics.avgSpeedKmh | km/h | |
| Raw metadata | From DeviceFile | — | metrics.rawMetrics | deviceFileId, sampleCount, start/end MMDD+ms | |
| Normalized metrics | From TrajectoryMetrics | — | metrics.normalizedMetrics | distance, speeds, duration | Convenience for analytics |
| Sprint/heatmap/quality6D/G-force | Not provided | — | metrics fields | — | Left null/unused in this integration |

## 5. Current Limitations & Assumptions
- Year assumed: current UTC year when converting MMDD + ms-of-day to ISO.
- Sprints, G-force, heatmap, quality6D not provided by ActionMark protocol v1; fields remain null.
- Distance via Haversine with Earth radius ~6,371 km; deltas interpreted at 100 ms steps.
- Avg speed uses total distance / total duration; if duration is zero or only one point, speeds default to 0.

## 6. Future Extensions
- Replace BLE stubs with real BLE in `actionTracerBle.ts` (scan/connect/read).
- Enrich `normalizedMetrics` with sprint analytics once computed.
- Visualize trajectories/heatmaps in web/mobile using `motionTrajectoryData`.
