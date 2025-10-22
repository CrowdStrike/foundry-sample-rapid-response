# E2E Testing for Rapid Response Foundry App

Comprehensive end-to-end testing framework using Playwright for the Rapid Response Foundry application.

## Overview

This E2E testing framework validates:
- App installation and deployment
- Navigation between all app pages
- UI component rendering
- Core functionality accessibility

## Quick Start

### Prerequisites

- Node.js 22+ (LTS)
- Foundry CLI (for app deployment)
- Falcon console access with valid credentials

### Setup

1. **Install dependencies:**
   ```bash
   cd e2e
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.sample .env
   ```

   Edit `.env` with your credentials:
   ```env
   APP_NAME=foundry-sample-rapid-response
   FALCON_BASE_URL=https://falcon.us-2.crowdstrike.com
   FALCON_USERNAME=your-falcon-username
   FALCON_PASSWORD=your-falcon-password
   FALCON_AUTH_SECRET=your-mfa-secret
   ```

   **Important Notes:**
   - For CrowdStrike internal engineers: These are NOT your Okta credentials. Use shared test credentials from the Foundry team.
   - For external users: Use your standard Falcon console credentials.
   - If using SSO, create a user that supports password + MFA authentication.

4. **Deploy the app (local testing):**
   ```bash
   # From project root
   foundry apps deploy --change-type=major
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run with verbose output
npm run test:verbose

# Run with Playwright UI (debugging)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed
```

## Test Coverage

The test suite includes 7 comprehensive tests:

1. **App Installation & Navigation** - Verifies app can be accessed via Custom Apps menu
2. **All Jobs Page** - Validates jobs listing page renders correctly
3. **Run History Page** - Checks job execution history page
4. **Audit Log Page** - Verifies audit log display
5. **Create Job Accessibility** - Tests Create Job button functionality
6. **Navigation Flow** - Validates navigation between all pages
7. **Visual Verification** - Captures screenshots for manual review

## Architecture

### Directory Structure

```
e2e/
├── src/
│   ├── config/
│   │   └── TestConfig.ts          # Environment configuration
│   ├── utils/
│   │   ├── Logger.ts              # Structured logging
│   │   └── SmartWaiter.ts         # Smart waiting utilities
│   ├── pages/
│   │   ├── BasePage.ts            # Base page object
│   │   ├── FoundryHomePage.ts     # Foundry home navigation
│   │   ├── AppManagerPage.ts      # App manager interactions
│   │   ├── AppCatalogPage.ts      # App installation logic
│   │   ├── RapidResponseHomePage.ts  # Main app page
│   │   ├── AllJobsPage.ts         # Jobs listing
│   │   ├── RunHistoryPage.ts      # History page
│   │   └── AuditLogPage.ts        # Audit log page
│   ├── authenticate.cjs           # Authentication utilities
│   ├── utils.cjs                  # Helper functions
│   └── fixtures.ts                # Playwright fixtures
├── tests/
│   ├── authenticate.setup.ts      # Auth setup
│   └── foundry.spec.ts           # Main test suite
├── constants/
│   └── AuthFile.ts               # Auth constants
├── .env.sample                    # Environment template
├── playwright.config.ts           # Playwright configuration
└── package.json                   # Dependencies
```

### Key Design Patterns

#### Page Object Model (POM)
All pages inherit from `BasePage` which provides:
- Smart clicking with retry logic
- Element existence checking
- Navigation utilities
- Screenshot capture
- Error handling

#### Smart Waiting
Uses `SmartWaiter` for condition-based waiting:
- No hard-coded timeouts
- Retry logic with exponential backoff
- State-aware element detection

#### Fixtures
Dependency injection for page objects:
```typescript
test('my test', async ({ rapidResponseHomePage }) => {
  await rapidResponseHomePage.navigateToApp();
});
```

## CI/CD Integration

Tests run automatically via GitHub Actions (`.github/workflows/e2e.yml`):

1. Builds Go functions and React app
2. Deploys app with unique name
3. Runs E2E tests
4. Uploads artifacts (screenshots, reports)
5. Cleans up deployed app

### Required GitHub Secrets

Configure these secrets in your repository:

- `FALCON_CLIENT_ID` - Foundry API client ID
- `FALCON_CLIENT_SECRET` - Foundry API client secret
- `FALCON_USERNAME` - Test user username
- `FALCON_PASSWORD` - Test user password
- `FALCON_AUTH_SECRET` - TOTP secret for MFA

## Troubleshooting

### App Not Found in Custom Apps

**Problem:** Tests fail with "App not found in Custom Apps menu"

**Solution:**
1. Verify app is deployed: `foundry apps list-deployments`
2. Check app name matches: Should be `foundry-sample-rapid-response`
3. Ensure app is installed in Falcon console
4. Try redeploying: `foundry apps deploy --change-type=major`

### Authentication Failures

**Problem:** Tests fail during authentication

**Solution:**
1. Verify credentials in `.env` file
2. Check MFA secret is correct
3. Ensure user has proper permissions
4. Try regenerating TOTP secret

### Element Not Found

**Problem:** Tests timeout waiting for elements

**Solution:**
1. Check if app UI has changed
2. Verify page selectors in page objects
3. Increase timeout in `playwright.config.ts`
4. Run tests in headed mode to debug: `npm run test:headed`

### Tests Pass Locally but Fail in CI

**Problem:** Tests work locally but fail in GitHub Actions

**Solution:**
1. Verify GitHub secrets are configured
2. Check app deployment step succeeded
3. Review CI logs for specific errors
4. Ensure app name is unique in CI (uses timestamp)

## Best Practices

### Writing Tests

1. **Use semantic locators:** Prefer `getByRole()` over CSS selectors
2. **Single responsibility:** One test per feature
3. **No hard timeouts:** Use `SmartWaiter` utilities
4. **Proper cleanup:** Close modals in `afterEach`
5. **Descriptive names:** Clear test descriptions

### Debugging

1. **Run in UI mode:** `npm run test:ui` - Interactive debugging
2. **Enable screenshots:** Automatically captured on failure
3. **Check logs:** Structured logging shows execution flow
4. **Use headed mode:** `npm run test:headed` - See browser actions

### Maintenance

1. **Update selectors:** When UI changes, update page objects
2. **Keep dependencies current:** Run `npm update` regularly
3. **Review screenshots:** Visual verification catches UI issues
4. **Monitor CI:** Address flaky tests immediately

## Framework Benefits

- **Robust:** Smart waiting and retry logic reduces flakiness
- **Maintainable:** Page Object Model isolates UI changes
- **Debuggable:** Structured logging and screenshots
- **Scalable:** Easy to add new tests and page objects
- **CI-Ready:** Full GitHub Actions integration

## Contributing

When adding new tests:

1. Create page objects for new pages in `src/pages/`
2. Add fixtures in `src/fixtures.ts`
3. Write tests in `tests/foundry.spec.ts`
4. Update this README with new coverage
5. Test locally before pushing

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Foundry CLI Documentation](https://falcon.crowdstrike.com/documentation/foundry)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)

## Support

For issues or questions:
- Check troubleshooting section above
- Review test logs in CI artifacts
- Contact the Foundry team for deployment issues
