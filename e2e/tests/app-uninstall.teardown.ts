import { test as teardown } from '../src/fixtures';

teardown('uninstall Rapid Response app', async ({ appCatalogPage, appName }) => {
  // Clean up by uninstalling the app after all tests complete
  await appCatalogPage.uninstallApp(appName);
});
