# RBAC Tests - Quick Start Guide

## TL;DR

Run these commands to validate RBAC protections:

```bash
cd /Users/lakhdari/Desktop/AppFoot/backend
npm run setup-test-users
npm run test:rbac
```

---

## 3 Ways to Test RBAC

### 1. Automated E2E Tests (5 minutes)

```bash
# Navigate to backend
cd backend

# Setup test users
npm run setup-test-users

# Run tests
npm run test:rbac

# Cleanup (optional)
npm run cleanup-test-users
```

**Expected Result:** 60+ tests pass, access matrix shows 100% match

---

### 2. Manual Testing (30 minutes)

```bash
# Setup test users
cd backend
npm run setup-test-users

# Follow checklist
open ../STAGING_TEST_CHECKLIST.md

# Test using curl commands provided in checklist
# Mark checkboxes as you complete each test
```

**Expected Result:** All checkboxes marked, QA sign-off complete

---

### 3. Quick Smoke Test (2 minutes)

```bash
# Login as FREE user
FREE_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free@test.com","password":"Test1234!"}' | jq -r '.accessToken')

# Try to access AI endpoint (should fail)
curl -X POST http://localhost:3000/ai/summary \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test"}' | jq

# Login as GOLD user
GOLD_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gold@test.com","password":"Test1234!"}' | jq -r '.accessToken')

# Try to access AI endpoint (should succeed)
curl -X POST http://localhost:3000/ai/summary \
  -H "Authorization: Bearer $GOLD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test"}' | jq
```

**Expected Result:** FREE returns 403, GOLD returns 200

---

## What's Being Tested?

### Subscription Tiers
- ❌ FREE: Blocked from AI endpoints
- ❌ BASIC: Blocked from AI endpoints
- ✅ GOLD: AI endpoints accessible
- ✅ PRO: All features accessible
- ✅ ENTERPRISE: Unrestricted

### User Roles
- ❌ PUBLIC: Cannot create/edit/delete
- ✅ SCOUT: Can create/edit (not delete)
- ✅ ADMIN: Can create/edit/delete

### Error Messages
- Clear and actionable
- Mentions required tier/role
- No security leaks

---

## Test Users

All users have password: `Test1234!`

| Email | Role | Tier | Use Case |
|-------|------|------|----------|
| free@test.com | PUBLIC | FREE | Test FREE restrictions |
| gold@test.com | SCOUT | GOLD | Test GOLD AI access |
| admin@test.com | ADMIN | PRO | Test ADMIN permissions |

**Full list:** 10 test users created (see RBAC_TESTING_SUMMARY.md)

---

## Common Commands

```bash
# Create test users
npm run setup-test-users

# Run all RBAC tests
npm run test:rbac

# Run specific test suite
npm run test:rbac -- -t "Subscription Tier"

# Run with verbose output
npm run test:rbac -- --verbose

# Cleanup test users
npm run cleanup-test-users
```

---

## Files Reference

| File | Purpose | Location |
|------|---------|----------|
| E2E Tests | Automated test suite | `/backend/test/rbac-validation.e2e-spec.ts` |
| Manual Checklist | Step-by-step manual tests | `/STAGING_TEST_CHECKLIST.md` |
| Test Users Script | Setup/cleanup test users | `/backend/scripts/setup-test-users.ts` |
| Summary | Complete overview | `/RBAC_TESTING_SUMMARY.md` |
| Test Docs | Detailed documentation | `/backend/test/README.md` |

---

## Troubleshooting

### Tests Won't Run
```bash
# Check if backend is running
curl http://localhost:3000/health

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Verify test users exist
npm run setup-test-users
```

### Tests Failing
```bash
# Check environment variables
echo $DATABASE_URL
echo $JWT_SECRET

# Check if guards are registered
# Review: backend/src/app.module.ts

# View detailed errors
npm run test:rbac -- --verbose
```

### Can't Login
```bash
# Recreate test users
npm run cleanup-test-users
npm run setup-test-users

# Test login manually
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gold@test.com","password":"Test1234!"}'
```

---

## Success Criteria

✅ All E2E tests pass (60+/60)
✅ Access matrix shows 100% match
✅ Error messages are clear
✅ No information leakage
✅ Response times < 500ms

---

## Next Steps After Tests Pass

1. ✅ Deploy to staging
2. ✅ Run manual checklist in staging
3. ✅ QA sign-off
4. ✅ Deploy to production
5. ✅ Monitor error rates

---

## Need Help?

- 📖 **Detailed Docs:** `/backend/test/README.md`
- 📋 **Manual Checklist:** `/STAGING_TEST_CHECKLIST.md`
- 📊 **Full Summary:** `/RBAC_TESTING_SUMMARY.md`
- 💬 **Contact:** Development team

---

**Created:** November 7, 2025
**Status:** ✅ Ready to Execute
**Estimated Time:** 5-30 minutes depending on method chosen
