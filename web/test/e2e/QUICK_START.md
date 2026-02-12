# E2E Tests Quick Start Guide

## Installation
Playwright is already installed! Just run tests.

## Quick Commands

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in interactive UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run specific test files
```bash
# Login tests
npx playwright test test/e2e/auth/login.spec.ts

# Player list tests
npx playwright test test/e2e/players/list.spec.ts

# Player detail tests
npx playwright test test/e2e/players/detail.spec.ts

# Dashboard tests
npx playwright test test/e2e/dashboard/dashboard.spec.ts
```

### Run tests with browser visible
```bash
npx playwright test --headed
```

### Debug a specific test
```bash
npx playwright test --debug test/e2e/auth/login.spec.ts
```

### Run only failed tests
```bash
npx playwright test --last-failed
```

### Generate test report
```bash
npx playwright show-report
```

## Test Files Overview

| File | Tests | Coverage |
|------|-------|----------|
| `auth/login.spec.ts` | 26 | Login form, validation, error handling, navigation |
| `players/list.spec.ts` | 37 | Player listing, search, filters, sorting, cards |
| `players/detail.spec.ts` | 30 | Player details, ratings, reports, navigation |
| `dashboard/dashboard.spec.ts` | 31 | Stats, AI features, charts, activity, tasks |
| **TOTAL** | **124** | **Complete user flows** |

## Common Test Patterns

### Check if element exists
```typescript
await expect(page.getByText('Dashboard')).toBeVisible();
```

### Click button
```typescript
await page.getByRole('button', { name: /sign in/i }).click();
```

### Fill input
```typescript
await page.getByPlaceholder(/email/i).fill('test@example.com');
```

### Select dropdown
```typescript
await page.locator('select').selectOption('FORWARD');
```

### Check navigation
```typescript
await expect(page).toHaveURL('/dashboard');
```

## Useful Options

### Run on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run with trace
```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Run with video
```bash
npx playwright test --video on
```

### Update screenshots
```bash
npx playwright test --update-snapshots
```

## Debugging Tips

1. **Use UI Mode**: `npm run test:e2e:ui` - best for debugging
2. **Add breakpoints**: Use `await page.pause()` in test code
3. **Inspect selectors**: Use Playwright Inspector
4. **Check screenshots**: Failed tests automatically capture screenshots
5. **View traces**: Use `npx playwright show-trace` for detailed execution

## File Locations

- **Tests**: `/Users/lakhdari/Desktop/AppFoot/web/test/e2e/`
- **Config**: `/Users/lakhdari/Desktop/AppFoot/web/playwright.config.ts`
- **Reports**: `/Users/lakhdari/Desktop/AppFoot/web/playwright-report/`
- **Test Results**: `/Users/lakhdari/Desktop/AppFoot/web/test-results/`

## CI/CD Ready

Tests are configured to run in CI with:
- Automatic retries (2x)
- Screenshots on failure
- Video recording on failure
- HTML report generation
- Single worker for stability

## Need Help?

- Read full documentation: `test/e2e/README.md`
- View test summary: `test/e2e/TEST_SUMMARY.md`
- Playwright docs: https://playwright.dev
