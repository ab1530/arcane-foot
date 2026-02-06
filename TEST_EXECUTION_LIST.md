# 🧪 TEST EXECUTION LIST - ARCANE DEMO

**Date**: 2025-11-14
**Purpose**: Verify all fixes are production-ready
**Scope**: Backend API + Web App + Mobile App

---

## ✅ BACKEND API TESTS

### 1. Health Check
```bash
cd backend

# Test 1.1: API is running
curl http://localhost:5001/api/health
# Expected: {"status":"ok"}

# Test 1.2: Database connection
npx prisma db execute --stdin <<< "SELECT 1"
# Expected: Query executed successfully
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 2. Authentication Tests
```bash
# Test 2.1: Login with valid credentials
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"scout1@arcane.com","password":"<DEMO_PASSWORD>"}' \
  -s | jq '.accessToken'

# Expected: JWT token returned (eyJhbGci...)

# Test 2.2: Login with invalid credentials
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@email.com","password":"wrong"}' \
  -s | jq '.statusCode'

# Expected: 401
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 3. Players API Tests (CRITICAL - Fixed in this sprint)
```bash
# Get auth token first
export TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"scout1@arcane.com","password":"<DEMO_PASSWORD>"}' \
  -s | jq -r '.accessToken')

# Test 3.1: Get all players (MUST return 200 OK, not 500)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/players \
  -s | jq '.data | length'

# Expected: Number > 0 (e.g., 200)

# Test 3.2: Verify schema (check new columns exist)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/players \
  -s | jq '.data[0] | has("conversionNotes", "rejectionReason")'

# Expected: true

# Test 3.3: Get single player
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/players/{PLAYER_ID} \
  -s | jq '.player.id'

# Expected: Player ID returned

# Test 3.4: Player with relations (users, clubs)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/players \
  -s | jq '.data[0].users.email'

# Expected: Email returned (relations working)
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 4. Database Migration Tests
```bash
# Test 4.1: Run migration script
npx ts-node run-migration.ts

# Expected output:
# Applying 21 SQL statements...
# ✓ OK: ALTER TABLE players ADD COLUMN IF NOT EXISTS "conversionNotes"...
# ✅ Migration completed!

# Test 4.2: Direct Prisma query
npx ts-node debug-players.ts

# Expected output:
# ✅ SUCCESS: Found X players
# Sample player: { id: "...", conversionNotes: null, ... }

# Test 4.3: Prisma client regeneration
npx prisma generate

# Expected: ✔ Generated Prisma Client
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 5. Other API Endpoints
```bash
# Test 5.1: Clubs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/clubs \
  -s | jq '.data | length'
# Expected: > 0

# Test 5.2: Matches
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/matches \
  -s | jq '.data | length'
# Expected: > 0

# Test 5.3: Reports
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/scouting-reports \
  -s | jq '.data | length'
# Expected: > 0

# Test 5.4: Camps
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/camps \
  -s | jq 'type'
# Expected: "array"
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 6. RBAC & E2E Tests
```bash
# Test 6.1: RBAC tests
npm run test:rbac

# Expected: All tests pass (✓ SCOUT can..., ✓ ADMIN can...)

# Test 6.2: E2E tests
npm run test:e2e

# Expected: All API endpoint tests pass

# Test 6.3: Unit tests (if exist)
npm test

# Expected: All unit tests pass
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

## ✅ WEB APP TESTS

### 7. Build & Compile
```bash
cd web

# Test 7.1: Install dependencies
npm install
# Expected: No errors

# Test 7.2: TypeScript compilation
npm run build
# Expected: ✅ Compiled successfully

# Test 7.3: Linting
npm run lint
# Expected: No errors (or only warnings)
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 8. React Query Hooks Tests
```bash
# Test 8.1: Verify hooks file exists
ls -lh web/src/hooks/useData.ts
# Expected: File exists (~30KB)

# Test 8.2: Import hooks (TypeScript check)
grep -c "export const use" web/src/hooks/useData.ts
# Expected: 20+ hooks exported

# Test 8.3: No mocks in hooks
grep -i "mock\|fake\|sample" web/src/hooks/useData.ts
# Expected: No matches
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 9. Dashboard Page Tests (CRITICAL - Fixed in this sprint)
```bash
# Test 9.1: No mock data in code
grep -n "totalPlayers: 42\|totalReports: 18" web/src/app/dashboard/page.tsx
# Expected: No matches (mocks removed)

# Test 9.2: Uses real API calls
grep -c "apiClient.get" web/src/app/dashboard/page.tsx
# Expected: 4+ API calls

# Test 9.3: No generateMockResponse function
grep -n "generateMockResponse" web/src/app/ai/arkane-gpt/page.tsx
# Expected: No matches
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 10. UI/E2E Tests (Playwright)
```bash
# Test 10.1: Run Playwright tests
npm run test:e2e

# Expected: All tests pass

# Test 10.2: Dashboard loads correctly
# Manual: Navigate to http://localhost:3000/dashboard
# Verify:
# - Stats show real numbers (not 42, 18, 5...)
# - Network tab shows API calls to /api/players, /api/reports
# - No console errors about "mockData"
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 11. Sample DNA Data Deprecated
```bash
# Test 11.1: File is deprecated
wc -l web/src/lib/utils/sample-dna-data.ts
# Expected: ~15 lines (down from 306)

# Test 11.2: No exports
grep "export const sample" web/src/lib/utils/sample-dna-data.ts
# Expected: No matches

# Test 11.3: Deprecation notice
grep "DEPRECATED" web/src/lib/utils/sample-dna-data.ts
# Expected: Match found
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

## ⚠️ MOBILE APP TESTS

### 12. API Configuration
```bash
cd mobile

# Test 12.1: API URL is dynamic
grep "process.env.EXPO_PUBLIC_API_URL" mobile/src/constants/config.ts
# Expected: Match found

# Test 12.2: API client has no mocks
grep -i "mock\|fake\|sample" mobile/src/services/api.ts
# Expected: No matches (except comments)

# Test 12.3: All endpoints mapped
grep -c "async get\|async post\|async put\|async delete" mobile/src/services/api.ts
# Expected: 80+ methods
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 13. Screen Mock Identification
```bash
# Test 13.1: Count screens with mocks
grep -rl "mockData\|sampleData\|placeholder" mobile/src/screens/ | wc -l
# Expected: 26 files (documented in MOBILE_API_SYNC.patch)

# Test 13.2: HIGH priority screens identified
ls mobile/src/screens/auth/LoginScreen.tsx \
   mobile/src/screens/ai/ArcaneIndexScreen.tsx \
   mobile/src/screens/matches/MatchesScreen.tsx
# Expected: All 5 files exist
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 14. Mobile App Startup
```bash
# Test 14.1: Install dependencies
npm install
# Expected: No errors

# Test 14.2: Start Metro bundler
npx expo start --clear
# Expected: Server starts, QR code shown

# Test 14.3: Run on simulator (optional)
# iOS: Press 'i'
# Android: Press 'a'
# Verify: App loads without crashes
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

### 15. Jest Tests (Mobile)
```bash
# Test 15.1: Run unit tests
npm test

# Expected: All tests pass

# Test 15.2: Coverage report
npm run test:coverage
# Expected: Coverage > 60% (current baseline)
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

## 🔄 INTEGRATION TESTS

### 16. Full Stack Integration
```bash
# Test 16.1: Backend + Web + Mobile all running
# Terminal 1: cd backend && npm run start:dev
# Terminal 2: cd web && npm run dev
# Terminal 3: cd mobile && npx expo start

# Verify all 3 servers start without errors

# Test 16.2: End-to-end flow
# 1. Web: Login at http://localhost:3000/login
# 2. Web: Dashboard shows real data
# 3. Web: Create player
# 4. API: Verify player in DB (curl /api/players)
# 5. Mobile: Login on simulator
# 6. Mobile: See newly created player

# Expected: All steps work, data syncs across platforms
```

**Status**: ⬜ Not Run | ✅ Pass | ❌ Fail

---

## 📊 SUMMARY CHECKLIST

### Backend (7 tests)
- [ ] 1. Health Check
- [ ] 2. Authentication
- [ ] 3. Players API ⭐ (CRITICAL FIX)
- [ ] 4. Database Migration ⭐ (CRITICAL FIX)
- [ ] 5. Other Endpoints
- [ ] 6. RBAC & E2E

### Web (9 tests)
- [ ] 7. Build & Compile
- [ ] 8. React Query Hooks ⭐ (NEW)
- [ ] 9. Dashboard No Mocks ⭐ (CRITICAL FIX)
- [ ] 10. Playwright E2E
- [ ] 11. Sample DNA Deprecated ⭐ (CLEANUP)

### Mobile (4 tests)
- [ ] 12. API Configuration
- [ ] 13. Mock Identification ⚠️ (26 screens)
- [ ] 14. App Startup
- [ ] 15. Jest Tests

### Integration (1 test)
- [ ] 16. Full Stack Flow

---

## 🎯 SUCCESS CRITERIA

**MUST PASS** (Critical):
- ✅ Backend: Players API returns 200 (not 500) ⭐
- ✅ Backend: Migration adds columns successfully ⭐
- ✅ Web: Build compiles with no errors
- ✅ Web: Dashboard uses real API (no 42, 18 mocks) ⭐
- ✅ Web: useData.ts hooks work correctly ⭐
- ✅ Mobile: API client is clean (0 mocks)

**SHOULD PASS** (Important):
- ✅ Backend: RBAC tests pass
- ✅ Web: Playwright tests pass
- ✅ Mobile: Screens identified for cleanup

**NICE TO HAVE** (Optional):
- ⬜ Full end-to-end integration test
- ⬜ Mobile screens cleaned (26 files)
- ⬜ 100% test coverage

---

## 📝 EXECUTION LOG

**Tester**: __________________
**Date**: __________________

### Test Results:

| Test # | Name | Status | Notes |
|--------|------|--------|-------|
| 1 | Health Check | ⬜ | |
| 2 | Authentication | ⬜ | |
| 3 | Players API ⭐ | ⬜ | MUST PASS |
| 4 | DB Migration ⭐ | ⬜ | MUST PASS |
| 5 | Other Endpoints | ⬜ | |
| 6 | RBAC & E2E | ⬜ | |
| 7 | Web Build | ⬜ | |
| 8 | React Query ⭐ | ⬜ | MUST PASS |
| 9 | Dashboard ⭐ | ⬜ | MUST PASS |
| 10 | Playwright | ⬜ | |
| 11 | DNA Deprecated | ⬜ | |
| 12 | Mobile Config | ⬜ | |
| 13 | Mock ID | ⬜ | |
| 14 | Mobile Start | ⬜ | |
| 15 | Jest Mobile | ⬜ | |
| 16 | Integration | ⬜ | |

**Overall Status**: ⬜ PASS | ⬜ FAIL

**Notes**:
____________________________________________________________
____________________________________________________________
____________________________________________________________

---

**END OF TEST EXECUTION LIST**
