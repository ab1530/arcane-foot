# E2E Test Suite

Comprehensive End-to-End tests for the ARCANE Football Next.js frontend using Playwright.

## Test Structure

```
test/e2e/
├── auth/
│   └── login.spec.ts           # Login flow tests
├── players/
│   ├── list.spec.ts            # Player listing and filtering tests
│   └── detail.spec.ts          # Player detail view tests
├── dashboard/
│   └── dashboard.spec.ts       # Dashboard functionality tests
└── fixtures/
    ├── test-helpers.ts         # Reusable test utilities
    └── test-data.ts            # Test data fixtures
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test test/e2e/auth/login.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests with debugging
```bash
npx playwright test --debug
```

## Test Coverage

### Authentication Tests (`auth/login.spec.ts`)
- **Page Load and UI**: Verifies all login page elements are displayed
- **Form Validation**: Tests empty form submission, email format, required fields
- **Password Visibility Toggle**: Tests show/hide password functionality
- **Login Submission**: Tests invalid credentials, loading states, network errors
- **Navigation Links**: Tests signup, forgot password, and home navigation
- **Accessibility**: Keyboard navigation and ARIA labels
- **Remember Me**: Checkbox functionality
- **Responsive Design**: Mobile, tablet, and desktop layouts
- **Error States**: Error message display and clearing
- **Security**: Password masking and no localStorage storage

**Total Tests**: 26 test cases across 10 test suites

### Player List Tests (`players/list.spec.ts`)
- **Page Load and UI**: Stats cards, filters, search input, add player button
- **Search Functionality**: Filter by name, nationality, clear search, no results
- **Position Filter**: Filter by position, all position options
- **Advanced Filters**: Show/hide filters, nationality, age range, filter badges
- **Sorting**: Sort by name, age, reports, rating
- **Player Cards**: Display information, navigation, hover effects, rating badges
- **Error States**: API errors, network errors, empty state
- **Responsive Design**: Mobile, tablet, desktop grid layouts
- **Add Player Action**: Button visibility and navigation
- **Combined Filters**: Multiple filters and sort together

**Total Tests**: 37 test cases across 11 test suites

### Player Detail Tests (`players/detail.spec.ts`)
- **Page Load and UI**: Player information, action buttons, breadcrumb
- **Player Information Card**: Personal details, club, rating badge, age calculation
- **Average Ratings Section**: All rating categories, empty state, animated counters
- **Report Statistics**: Approved reports, pending review counts
- **Scouting Reports Section**: Report list, metadata, status badges, recommendations
- **Navigation Actions**: Back button, create report, breadcrumb navigation
- **Error States**: Player not found, API errors, network errors
- **Responsive Design**: Mobile, tablet, desktop layouts
- **Report Status Badges**: Color coding for different statuses
- **Accessibility**: Keyboard navigation, heading hierarchy

**Total Tests**: 30 test cases across 10 test suites

### Dashboard Tests (`dashboard/dashboard.spec.ts`)
- **Page Load and UI**: Heading, sections, subscription tier badge
- **Quick Stats Cards**: All four stats, animated counters, trends, navigation
- **AI Features Section**: Feature cards, descriptions, tier requirements
- **Quick Actions Section**: Action buttons, navigation
- **Charts Section**: Line chart, pie chart, area chart, bar chart
- **Recent Activity Section**: Activity feed, items with details, empty state
- **Pending Tasks Section**: Task list, pending reports, upgrade prompt
- **Error Handling**: API errors, fallback data
- **Responsive Design**: Mobile, tablet, desktop layouts
- **Navigation**: Tier badge, matches, calendar links
- **Interactive Elements**: Hover effects on cards
- **Accessibility**: Keyboard navigation, heading structure

**Total Tests**: 32 test cases across 12 test suites

## Test Utilities

### Test Helpers (`fixtures/test-helpers.ts`)
- `navigateAndWait()`: Navigate to page and wait for load
- `hasHeading()`: Check for page heading
- `waitForToast()`: Wait for toast notifications
- `mockApiResponse()`: Mock API responses
- `mockApiError()`: Mock API errors
- `mockAuthSession()`: Mock authenticated session
- `clearSession()`: Clear cookies and storage
- And more...

### Test Data (`fixtures/test-data.ts`)
- `TEST_USERS`: Valid, invalid, and new user credentials
- `TEST_PLAYERS`: Sample player data with various positions
- `TEST_REPORTS`: Sample scouting reports
- `TEST_CAMPS`: Sample training camps
- `DASHBOARD_STATS`: Dashboard statistics
- `API_ENDPOINTS`: API endpoint patterns

## Best Practices

1. **Use Test Helpers**: Leverage reusable utilities from `test-helpers.ts`
2. **Mock API Calls**: Always mock API responses for consistent tests
3. **Test User Flows**: Focus on complete user journeys, not just individual elements
4. **Test Error States**: Include error handling and edge cases
5. **Responsive Testing**: Test on multiple viewport sizes
6. **Accessibility**: Include keyboard navigation and ARIA tests
7. **Descriptive Names**: Use clear, descriptive test names
8. **Independent Tests**: Each test should be able to run independently

## Configuration

Tests are configured in `/Users/lakhdari/Desktop/AppFoot/web/playwright.config.ts`:
- **Test Directory**: `./test/e2e`
- **Base URL**: `http://127.0.0.1:3000`
- **Browser**: Chromium (configurable)
- **Retries**: 2 retries in CI, 0 locally
- **Workers**: 1 in CI, parallel locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Trace**: On first retry

## Debugging

### View test report
```bash
npx playwright show-report
```

### Run with trace viewer
```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Run specific test with debug
```bash
npx playwright test auth/login.spec.ts --debug
```

## CI/CD Integration

Tests are configured to run in CI environments:
- Automatic retry on failure (2 retries)
- Single worker for stability
- Screenshots and traces on failure
- HTML report generation

## Contributing

When adding new tests:
1. Follow the existing structure and naming conventions
2. Add test data to `fixtures/test-data.ts`
3. Use helpers from `fixtures/test-helpers.ts`
4. Include error states and edge cases
5. Test responsive behavior
6. Update this README with new test coverage

## Total Coverage

- **Total Test Suites**: 43+
- **Total Test Cases**: 125+
- **Coverage Areas**: Authentication, Player Management, Dashboard, Navigation, Error Handling, Responsive Design, Accessibility
