import { test as teardown } from '@playwright/test';
import { RapidResponseHomePage } from '../src/pages/RapidResponseHomePage';

teardown('uninstall Rapid Response app', async ({ page }) => {
  const rapidResponseHomePage = new RapidResponseHomePage(page);

  // Clean up by uninstalling the app after all tests complete
  await rapidResponseHomePage.uninstallApp();
});
