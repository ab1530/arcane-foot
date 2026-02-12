# STAGING TEST CHECKLIST - RBAC VALIDATION

## Overview
This checklist validates that Role-Based Access Control (RBAC) protections work correctly across all subscription tiers and user roles in the staging environment.

**Last Updated:** November 7, 2025
**Environment:** Staging
**Tester:** _________________
**Date:** _________________

---

## Pre-Test Setup

### Environment Check
- [ ] Staging environment is running and accessible
- [ ] Database is in healthy state
- [ ] All services are operational (check `/health` endpoint)
- [ ] JWT authentication is working
- [ ] Stripe integration is configured (if testing payments)

### Test Users Required
Create the following test users in staging (or use existing):

| Email | Password | Role | Subscription Tier | Purpose |
|-------|----------|------|-------------------|---------|
| free@staging.test | Test1234! | PUBLIC | FREE | Test FREE tier restrictions |
| basic@staging.test | Test1234! | SCOUT | BASIC | Test BASIC tier access |
| gold@staging.test | Test1234! | SCOUT | GOLD | Test GOLD tier access |
| pro@staging.test | Test1234! | AGENT | PRO | Test PRO tier access |
| enterprise@staging.test | Test1234! | ADMIN | ENTERPRISE | Test ENTERPRISE tier access |
| public@staging.test | Test1234! | PUBLIC | FREE | Test PUBLIC role restrictions |
| scout@staging.test | Test1234! | SCOUT | GOLD | Test SCOUT role permissions |
| admin@staging.test | Test1234! | ADMIN | PRO | Test ADMIN role permissions |

---

## Section 1: Authentication Tests

### 1.1 Login & Token Generation
- [ ] **Test:** Login with each test user
  - **Expected:** Receive JWT access token and refresh token
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"gold@staging.test","password":"Test1234!"}'
    ```
  - **Result:** ___________
  - **Notes:** ___________

- [ ] **Test:** Get current user info (`/auth/me`)
  - **Expected:** Returns user profile with role and tier
  - **Command:**
    ```bash
    curl -X GET https://staging.api.arcane.com/auth/me \
      -H "Authorization: Bearer YOUR_TOKEN"
    ```
  - **Result:** ___________

### 1.2 Invalid Authentication
- [ ] **Test:** Request without token
  - **Expected:** 401 Unauthorized
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/ai/summary \
      -H "Content-Type: application/json" \
      -d '{"prompt":"Test"}'
    ```
  - **Result:** ___________

- [ ] **Test:** Request with invalid token
  - **Expected:** 401 Unauthorized
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/ai/summary \
      -H "Authorization: Bearer invalid-token-12345" \
      -H "Content-Type: application/json" \
      -d '{"prompt":"Test"}'
    ```
  - **Result:** ___________

---

## Section 2: Subscription Tier Access Control

### 2.1 FREE Tier Restrictions
**User:** `free@staging.test`

- [ ] **Test:** Access AI Summary endpoint
  - **Endpoint:** `POST /ai/summary`
  - **Expected:** 403 Forbidden with message "This feature requires at least GOLD subscription tier"
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/ai/summary \
      -H "Authorization: Bearer FREE_USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"prompt":"Generate summary"}'
    ```
  - **Result:** ___________
  - **Error Message Clear?** Yes / No

- [ ] **Test:** Access Player AI Index
  - **Endpoint:** `GET /ai/index/:playerId`
  - **Expected:** 403 Forbidden
  - **Result:** ___________

- [ ] **Test:** Access ArkaneMatch Chat
  - **Endpoint:** `POST /arkane-match/chat`
  - **Expected:** 403 Forbidden
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/arkane-match/chat \
      -H "Authorization: Bearer FREE_USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"message":"Find scouts","conversationId":null}'
    ```
  - **Result:** ___________

- [ ] **Test:** Access SmartScout Suggestions
  - **Endpoint:** `POST /smart-scout/suggestions`
  - **Expected:** 403 Forbidden
  - **Result:** ___________

- [ ] **Test:** Access Player Analysis
  - **Endpoint:** `GET /ai/player-analysis/:playerId`
  - **Expected:** 403 Forbidden
  - **Result:** ___________

- [ ] **Test:** Read public players (should work)
  - **Endpoint:** `GET /players`
  - **Expected:** 200 OK
  - **Command:**
    ```bash
    curl -X GET https://staging.api.arcane.com/players
    ```
  - **Result:** ___________

### 2.2 BASIC Tier Restrictions
**User:** `basic@staging.test`

- [ ] **Test:** All AI endpoints should be blocked (same as FREE)
  - **Expected:** 403 Forbidden on all AI endpoints
  - **Result:** ___________

- [ ] **Test:** Can create scouting reports
  - **Expected:** Success (if SCOUT role)
  - **Result:** ___________

### 2.3 GOLD Tier Access
**User:** `gold@staging.test`

- [ ] **Test:** Access AI Summary endpoint
  - **Endpoint:** `POST /ai/summary`
  - **Expected:** 200/201 Success (or 200 with AI response)
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/ai/summary \
      -H "Authorization: Bearer GOLD_USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"prompt":"Analyze player performance"}'
    ```
  - **Result:** ___________
  - **Response Received?** Yes / No

- [ ] **Test:** Access Player AI Index
  - **Endpoint:** `GET /ai/index/:playerId`
  - **Expected:** 200 Success
  - **Result:** ___________

- [ ] **Test:** Access ArkaneMatch Chat
  - **Endpoint:** `POST /arkane-match/chat`
  - **Expected:** 200 Success with AI response
  - **Result:** ___________

- [ ] **Test:** Access SmartScout Suggestions
  - **Endpoint:** `POST /smart-scout/suggestions`
  - **Expected:** 200 Success
  - **Result:** ___________

- [ ] **Test:** Access SmartScout Autocomplete
  - **Endpoint:** `POST /smart-scout/autocomplete`
  - **Expected:** 200 Success
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/smart-scout/autocomplete \
      -H "Authorization: Bearer GOLD_USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"fieldName":"position","partialValue":"For"}'
    ```
  - **Result:** ___________

- [ ] **Test:** Access Player Insights
  - **Endpoint:** `GET /smart-scout/insights/:playerId`
  - **Expected:** 200 Success
  - **Result:** ___________

- [ ] **Test:** Access Talent Prediction
  - **Endpoint:** `GET /ai/talent-prediction/:playerId`
  - **Expected:** 200 Success
  - **Result:** ___________

- [ ] **Test:** Access Match Recommendations
  - **Endpoint:** `GET /ai/match-recommendation/:playerId`
  - **Expected:** 200 Success
  - **Result:** ___________

- [ ] **Test:** Access Suspicious Detection
  - **Endpoint:** `GET /ai/suspicious-detection/:playerId`
  - **Expected:** 200 Success
  - **Result:** ___________

### 2.4 PRO Tier Access
**User:** `pro@staging.test`

- [ ] **Test:** All GOLD features work
  - **Expected:** All AI endpoints accessible
  - **Result:** ___________

- [ ] **Test:** Advanced analytics access
  - **Expected:** Success
  - **Result:** ___________

### 2.5 ENTERPRISE Tier Access
**User:** `enterprise@staging.test`

- [ ] **Test:** All features accessible
  - **Expected:** No restrictions
  - **Result:** ___________

---

## Section 3: Role-Based Access Control

### 3.1 PUBLIC Role Restrictions
**User:** `public@staging.test` (FREE tier, PUBLIC role)

- [ ] **Test:** Cannot create player
  - **Endpoint:** `POST /players`
  - **Expected:** 403 Forbidden with role-based error
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/players \
      -H "Authorization: Bearer PUBLIC_USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"firstName":"Test","lastName":"Player","dateOfBirth":"2000-01-01","nationality":"France","position":"Forward"}'
    ```
  - **Result:** ___________
  - **Error Message Mentions Role?** Yes / No

- [ ] **Test:** Cannot update player
  - **Endpoint:** `PUT /players/:id`
  - **Expected:** 403 Forbidden
  - **Result:** ___________

- [ ] **Test:** Cannot delete player
  - **Endpoint:** `DELETE /players/:id`
  - **Expected:** 403 Forbidden
  - **Result:** ___________

- [ ] **Test:** Can read players (public access)
  - **Endpoint:** `GET /players`
  - **Expected:** 200 Success
  - **Result:** ___________

### 3.2 SCOUT Role Permissions
**User:** `scout@staging.test` (GOLD tier, SCOUT role)

- [ ] **Test:** Can create player
  - **Endpoint:** `POST /players`
  - **Expected:** 201 Created
  - **Command:**
    ```bash
    curl -X POST https://staging.api.arcane.com/players \
      -H "Authorization: Bearer SCOUT_USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"firstName":"Created","lastName":"ByScout","dateOfBirth":"2000-01-01","nationality":"France","position":"Midfielder"}'
    ```
  - **Result:** ___________
  - **Player ID Created:** ___________

- [ ] **Test:** Can update player
  - **Endpoint:** `PUT /players/:id`
  - **Expected:** 200 Success
  - **Command:**
    ```bash
    curl -X PUT https://staging.api.arcane.com/players/PLAYER_ID \
      -H "Authorization: Bearer SCOUT_USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"firstName":"Updated"}'
    ```
  - **Result:** ___________

- [ ] **Test:** Cannot delete player
  - **Endpoint:** `DELETE /players/:id`
  - **Expected:** 403 Forbidden (only ADMIN can delete)
  - **Command:**
    ```bash
    curl -X DELETE https://staging.api.arcane.com/players/PLAYER_ID \
      -H "Authorization: Bearer SCOUT_USER_TOKEN"
    ```
  - **Result:** ___________
  - **Error Mentions ADMIN Required?** Yes / No

- [ ] **Test:** Can create scouting report
  - **Endpoint:** `POST /scouting-reports`
  - **Expected:** 201 Created
  - **Result:** ___________

### 3.3 ADMIN Role Permissions
**User:** `admin@staging.test` (PRO tier, ADMIN role)

- [ ] **Test:** Can create player
  - **Endpoint:** `POST /players`
  - **Expected:** 201 Created
  - **Result:** ___________

- [ ] **Test:** Can update player
  - **Endpoint:** `PUT /players/:id`
  - **Expected:** 200 Success
  - **Result:** ___________

- [ ] **Test:** Can delete player
  - **Endpoint:** `DELETE /players/:id`
  - **Expected:** 200/204 Success
  - **Command:**
    ```bash
    curl -X DELETE https://staging.api.arcane.com/players/PLAYER_ID \
      -H "Authorization: Bearer ADMIN_USER_TOKEN"
    ```
  - **Result:** ___________

- [ ] **Test:** Can access admin-only endpoints
  - **Example:** `POST /smart-scout/reindex-all`
  - **Expected:** 200 Success
  - **Result:** ___________

---

## Section 4: Error Message Quality

### 4.1 Tier Restriction Errors
- [ ] **Test:** Error message for tier restriction is clear
  - **User:** FREE tier
  - **Endpoint:** Any GOLD-tier endpoint
  - **Check:**
    - [ ] Message mentions required tier (e.g., "GOLD")
    - [ ] Message mentions "subscription"
    - [ ] Status code is 403
    - [ ] Has proper JSON structure (`statusCode`, `message`)
  - **Example Error:**
    ```json
    {
      "statusCode": 403,
      "message": "This feature requires at least GOLD subscription tier"
    }
    ```
  - **Result:** ___________

### 4.2 Role Restriction Errors
- [ ] **Test:** Error message for role restriction is clear
  - **User:** PUBLIC role
  - **Endpoint:** `POST /players`
  - **Check:**
    - [ ] Message mentions permission/role issue
    - [ ] Status code is 403
    - [ ] Does NOT leak sensitive info
  - **Result:** ___________

### 4.3 Authentication Errors
- [ ] **Test:** Missing token error is clear
  - **Expected:** 401 with "Unauthorized" message
  - **Result:** ___________

- [ ] **Test:** Invalid token error is clear
  - **Expected:** 401 with clear message
  - **Result:** ___________

---

## Section 5: Edge Cases & Security

### 5.1 Expired Subscription
- [ ] **Test:** User with expired subscription cannot access GOLD features
  - **Setup:** Update subscription status to CANCELLED or past endDate
  - **Expected:** 403 Forbidden
  - **Result:** ___________

### 5.2 Rate Limiting
- [ ] **Test:** AI endpoints respect rate limits (10/min)
  - **Expected:** 429 Too Many Requests after limit
  - **Command:** Make 11 requests to `/ai/summary` within 1 minute
  - **Result:** ___________

### 5.3 No Subscription Record
- [ ] **Test:** User without subscription gets auto-assigned FREE tier
  - **Expected:** System creates FREE subscription automatically
  - **Result:** ___________

### 5.4 Information Leakage
- [ ] **Test:** Error messages don't leak sensitive information
  - **Check:** No database details, API keys, secrets in errors
  - **Result:** ___________

---

## Section 6: Comprehensive Access Matrix

Test the following matrix manually or use the automated E2E test:

| Endpoint | Method | FREE | BASIC | GOLD | PRO | ENTERPRISE |
|----------|--------|------|-------|------|-----|------------|
| `/ai/summary` | POST | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/ai/index/:id` | GET | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/ai/matchmaking` | POST | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/ai/player-analysis/:id` | GET | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/arkane-match/chat` | POST | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/smart-scout/suggestions` | POST | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/players` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/players` | POST | ❌* | ✅* | ✅* | ✅* | ✅* |

*Depends on role: PUBLIC ❌, SCOUT+ ✅

- [ ] All combinations tested and match expected behavior
- [ ] Discrepancies documented: ___________

---

## Section 7: Integration Tests

### 7.1 Subscription Upgrade Flow
- [ ] **Test:** Upgrade FREE → GOLD and verify access granted
  - **Steps:**
    1. Login as FREE user
    2. Verify AI endpoints blocked (403)
    3. Upgrade to GOLD (via Stripe or admin panel)
    4. Verify AI endpoints now accessible (200)
  - **Result:** ___________

### 7.2 Subscription Downgrade Flow
- [ ] **Test:** Downgrade GOLD → FREE and verify access revoked
  - **Steps:**
    1. Login as GOLD user
    2. Verify AI endpoints accessible
    3. Downgrade to FREE
    4. Verify AI endpoints blocked (403)
  - **Result:** ___________

---

## Section 8: Performance & Load

### 8.1 Concurrent Requests
- [ ] **Test:** Multiple simultaneous requests with different users
  - **Expected:** All return correct status codes
  - **Result:** ___________

### 8.2 Guard Performance
- [ ] **Test:** Guard checks don't significantly slow down requests
  - **Expected:** Response time < 500ms
  - **Result:** ___________

---

## Rollback Procedure

If tests fail and rollback is needed:

1. **Identify the Issue:**
   - [ ] Document which test(s) failed
   - [ ] Capture error messages/logs
   - [ ] Note affected endpoints

2. **Immediate Actions:**
   - [ ] Notify team via Slack/Discord
   - [ ] Create incident ticket
   - [ ] Tag release in Git

3. **Rollback Steps:**
   ```bash
   # Backend rollback
   cd backend
   git checkout <previous-stable-commit>
   npm install
   npm run build
   pm2 restart arcane-backend

   # Database rollback (if migrations were run)
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

4. **Verification:**
   - [ ] Health check passes
   - [ ] Authentication works
   - [ ] Critical endpoints functional
   - [ ] Monitor error rates

5. **Post-Rollback:**
   - [ ] Document root cause
   - [ ] Create fix PR
   - [ ] Re-test in dev environment
   - [ ] Schedule new deployment

---

## Test Summary

**Date Completed:** ___________
**Tester:** ___________
**Duration:** ___________

**Test Results:**
- Total Tests: _____
- Passed: _____
- Failed: _____
- Skipped: _____

**Critical Issues Found:**
1. ___________
2. ___________
3. ___________

**Recommendation:**
- [ ] ✅ APPROVE - Deploy to production
- [ ] ⚠️ CONDITIONAL - Fix minor issues first
- [ ] ❌ BLOCK - Critical issues must be resolved

**Signature:** ___________
**Date:** ___________

---

## Appendix: Quick Reference

### Test User Credentials
```
FREE:       free@staging.test / Test1234!
BASIC:      basic@staging.test / Test1234!
GOLD:       gold@staging.test / Test1234!
PRO:        pro@staging.test / Test1234!
ENTERPRISE: enterprise@staging.test / Test1234!
```

### Common cURL Commands
```bash
# Login
curl -X POST https://staging.api.arcane.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gold@staging.test","password":"Test1234!"}'

# Get current user
curl -X GET https://staging.api.arcane.com/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test AI endpoint
curl -X POST https://staging.api.arcane.com/ai/summary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test"}'
```

### Useful Scripts
```bash
# Run automated E2E tests
cd backend
npm run test:e2e

# Check service health
curl https://staging.api.arcane.com/health

# View logs
pm2 logs arcane-backend --lines 100
```
