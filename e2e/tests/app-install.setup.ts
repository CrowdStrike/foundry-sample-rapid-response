import { test as setup } from '../src/fixtures';

setup('install Rapid Response app', async ({ rapidResponseHomePage }) => {
  // Use the existing navigateToApp() method which handles installation
  await rapidResponseHomePage.navigateToApp();
});
