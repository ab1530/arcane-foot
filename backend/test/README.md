# RBAC Testing Guide

## Overview

This directory contains comprehensive tests for validating Role-Based Access Control (RBAC) in the Arcane Football backend. The tests ensure that subscription tier protections and user role permissions work correctly across all endpoints.

## Test Files

### 1. `rbac-validation.e2e-spec.ts`
Comprehensive E2E test suite covering:
- Subscription tier access control (FREE, BASIC, GOLD, PRO, ENTERPRISE)
- User role permissions (PUBLIC, SCOUT, ADMIN, etc.)
- AI endpoint protections
- CRUD operation permissions
- Error message quality
- Edge cases and security

### 2. `jest-e2e.json`
Jest configuration for E2E tests with appropriate timeouts and settings.

### 3. `setup.ts`
Test environment setup with mock environment variables.

### 4. `prisma-mock.helper.ts`
Helper utilities for mocking Prisma in unit tests.

## Quick Start

### 1. Setup Test Users

Before running tests, create test users in your database:

```bash
# Create/update test users
npm run setup-test-users

# Cleanup test users
npm run cleanup-test-users
```

This creates 10 test users with different combinations of roles and subscription tiers:

| Email | Role | Tier | Purpose |
|-------|------|------|---------|
| free@test.com | PUBLIC | FREE | Test FREE tier restrictions |
| basic@test.com | SCOUT | BASIC | Test BASIC tier access |
| gold@test.com | SCOUT | GOLD | Test GOLD tier AI access |
| pro@test.com | AGENT | PRO | Test PRO tier features |
| enterprise@test.com | ADMIN | ENTERPRISE | Test unrestricted access |
| public@test.com | PUBLIC | FREE | Test PUBLIC role limits |
| scout@test.com | SCOUT | GOLD | Test SCOUT permissions |
| admin@test.com | ADMIN | PRO | Test ADMIN permissions |
| analyst@test.com | ANALYST | GOLD | Test ANALYST role |
| agent@test.com | AGENT | PRO | Test AGENT role |

All test users have password: `Test1234!`

### 2. Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run only RBAC validation tests
npm run test:rbac

# Run with verbose output
npm run test:rbac -- --verbose

# Run specific test suite
npm run test:rbac -- -t "Subscription Tier Access Control"
```

### 3. Manual Testing

For manual testing, use the comprehensive checklist:
- **File:** `/STAGING_TEST_CHECKLIST.md` (in project root)
- Contains step-by-step manual tests with curl commands
- Includes rollback procedures

## Test Structure

### Test Suites

#### 1. AI Endpoints - Subscription Tier Protection
Tests that FREE/BASIC users are blocked from AI endpoints, while GOLD+ users have access.

**Endpoints Tested:**
- `/ai/summary` (POST)
- `/ai/index/:playerId` (GET)
- `/ai/matchmaking` (POST)
- `/ai/player-analysis/:playerId` (GET)
- `/ai/talent-prediction/:playerId` (GET)
- `/ai/match-recommendation/:playerId` (GET)
- `/ai/suspicious-detection/:playerId` (GET)
- `/arkane-match/chat` (POST)
- `/smart-scout/suggestions` (POST)
- `/smart-scout/autocomplete` (POST)
- `/smart-scout/insights/:playerId` (GET)

**Expected Behavior:**
- FREE: 403 Forbidden
- BASIC: 403 Forbidden
- GOLD: 200/201 Success
- PRO: 200/201 Success
- ENTERPRISE: 200/201 Success

#### 2. Subscription Tier Hierarchy
Tests the correct tier ordering: FREE < BASIC < GOLD < PRO < ENTERPRISE

#### 3. Player CRUD - Role Protection
Tests role-based permissions for player operations:
- PUBLIC: Cannot create/update/delete
- SCOUT: Can create/update, cannot delete
- ADMIN: Can create/update/delete

#### 4. Authentication Required
Tests that unauthenticated requests are rejected:
- No token: 401
- Invalid token: 401
- Valid token: Allowed

#### 5. Error Messages - Clarity and Actionability
Tests that error messages:
- Mention required tier (e.g., "GOLD")
- Have proper structure (statusCode, message)
- Don't leak sensitive information

#### 6. Edge Cases and Security
Tests for:
- Expired subscriptions
- Users without subscription records
- Security vulnerabilities

#### 7. Comprehensive Access Matrix
Tests complete combinations of users and endpoints.

## Test Coverage

### Subscription Tiers Covered
- ✅ FREE (0 AI features)
- ✅ BASIC (no AI features)
- ✅ GOLD (full AI features)
- ✅ PRO (all features)
- ✅ ENTERPRISE (unlimited)

### User Roles Covered
- ✅ PUBLIC (read-only)
- ✅ SCOUT (create/edit reports and players)
- ✅ ANALYST (create/edit reports)
- ✅ AGENT (manage players)
- ✅ ADMIN (full CRUD)
- ✅ SUPER_ADMIN (unrestricted)

### Endpoints Covered
- ✅ 11 AI endpoints (GOLD+ required)
- ✅ Player CRUD operations
- ✅ Authentication endpoints
- ✅ Public read endpoints

### Test Scenarios
- ✅ 60+ individual test cases
- ✅ 100+ endpoint/user combinations
- ✅ Security edge cases
- ✅ Error message validation

## Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/test_db"

# JWT
JWT_SECRET="test-secret-key-change-in-production"
JWT_EXPIRES_IN="1h"

# Node environment
NODE_ENV="test"

# Optional (for AI features)
OPENAI_API_KEY="sk-..."
SUPABASE_URL="https://..."
SUPABASE_KEY="..."
```

### Database Setup

1. Create a test database:
```bash
createdb arcane_test
```

2. Run migrations:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/arcane_test" npm run prisma:deploy
```

3. Setup test users:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/arcane_test" npm run setup-test-users
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: arcane_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/arcane_test
        run: |
          npm run prisma:deploy
          npm run setup-test-users

      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/arcane_test
          JWT_SECRET: test-secret-key
          NODE_ENV: test
        run: npm run test:e2e
```

## Troubleshooting

### Tests Failing: Connection Issues

**Problem:** Database connection errors

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Tests Failing: Authentication Errors

**Problem:** JWT token issues

**Solution:**
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Verify test users exist
npm run setup-test-users

# Test login manually
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gold@test.com","password":"Test1234!"}'
```

### Tests Failing: Timeout Errors

**Problem:** Tests timing out (30s default)

**Solution:**
- Increase timeout in `jest-e2e.json`: `"testTimeout": 60000`
- Check if services are slow to start
- Reduce test parallelization: `"maxWorkers": 1`

### Tests Failing: Permission Errors

**Problem:** Unexpected 403/401 errors

**Solution:**
```bash
# Verify guards are properly registered
# Check AppModule imports

# Verify subscription tier service
# Check SubscriptionsService.hasMinimumTier()

# Check user role in database
psql $DATABASE_URL -c "SELECT email, role FROM users WHERE email='gold@test.com'"

# Check subscription tier in database
psql $DATABASE_URL -c "SELECT u.email, s.tier, s.status FROM users u JOIN subscriptions s ON u.id = s.user_id WHERE u.email='gold@test.com'"
```

## Best Practices

### When Writing New Tests

1. **Use Descriptive Names**
   ```typescript
   it('should prevent FREE user from accessing AI summary endpoint', async () => {
     // Test code
   });
   ```

2. **Test Both Success and Failure Cases**
   ```typescript
   it('should allow GOLD user to access AI endpoint', async () => {});
   it('should block FREE user from accessing AI endpoint', async () => {});
   ```

3. **Verify Error Messages**
   ```typescript
   expect(response.body.message).toContain('GOLD');
   expect(response.body.message).toContain('subscription');
   ```

4. **Clean Up Test Data**
   ```typescript
   afterAll(async () => {
     await cleanupTestData();
   });
   ```

5. **Use Proper HTTP Matchers**
   ```typescript
   .expect(403) // Specific status code
   expect(response.status).not.toBe(403) // When any success is OK
   ```

### When Testing RBAC

1. **Test all tier combinations**
   - FREE → Should fail
   - BASIC → Should fail (if GOLD+ required)
   - GOLD → Should succeed
   - PRO → Should succeed
   - ENTERPRISE → Should succeed

2. **Test all role combinations**
   - PUBLIC → Read-only
   - SCOUT → Create/Edit
   - ADMIN → Full CRUD

3. **Test error quality**
   - Clear message
   - Actionable (tells user what's needed)
   - No security leaks

4. **Test edge cases**
   - Expired subscriptions
   - Missing subscriptions
   - Invalid tokens

## Performance Considerations

### Test Execution Time

Current test suite execution time:
- **Unit tests:** ~5 seconds
- **E2E tests:** ~30-60 seconds
- **Full RBAC suite:** ~45 seconds

### Optimization Tips

1. **Use `beforeAll` instead of `beforeEach`** for expensive setup
2. **Reuse test users** instead of creating new ones per test
3. **Run tests in parallel** when possible (but be careful with database)
4. **Use test database** separate from dev/prod
5. **Mock external services** (Stripe, OpenAI) when appropriate

## Reporting

### Coverage Report

```bash
# Generate coverage report
npm run test:cov

# View coverage report
open coverage/lcov-report/index.html
```

### Test Results Format

Tests output results in table format for easy reading:

```
┌─────────┬──────────────────────┬──────┬──────────┬────────┬────────┬───────┐
│ (index) │       endpoint       │ tier │ expected │ actual │ status │ match │
├─────────┼──────────────────────┼──────┼──────────┼────────┼────────┼───────┤
│    0    │  'post /ai/summary'  │ FREE │   '✗'    │  '✗'   │  403   │ true  │
│    1    │  'post /ai/summary'  │ GOLD │   '✓'    │  '✓'   │  200   │ true  │
└─────────┴──────────────────────┴──────┴──────────┴────────┴────────┴───────┘
```

## Additional Resources

- **Manual Test Checklist:** `/STAGING_TEST_CHECKLIST.md`
- **Architecture Docs:** `/ARCHITECTURE.md`
- **API Documentation:** `http://localhost:3000/api` (Swagger)
- **Subscription Pricing:** `/backend/src/modules/subscriptions/subscription-pricing.config.ts`

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review existing test code for examples
3. Check CI/CD logs for detailed error messages
4. Consult team documentation

## Changelog

### 2025-11-07
- ✅ Created comprehensive RBAC E2E test suite
- ✅ Added test user setup script
- ✅ Created manual testing checklist
- ✅ Configured jest-e2e for E2E tests
- ✅ Documented testing procedures
