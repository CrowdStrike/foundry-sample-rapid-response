/**
 * RapidResponseHomePage - Main Rapid Response app page with navigation
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { config } from '../config/TestConfig';
import { RetryHandler } from '../utils/SmartWaiter';

export class RapidResponseHomePage extends BasePage {
  constructor(page: Page) {
    super(page, 'RapidResponseHomePage');
  }

  protected getPagePath(): string {
    // Note: Actual path will be dynamic based on deployed app
    // This is a placeholder - we'll navigate via Custom Apps menu instead
    throw new Error('Direct path navigation not supported. Use navigateToApp() or navigateToInstalledApp() instead.');
  }

  protected async verifyPageLoaded(): Promise<void> {
    const currentUrl = this.page.url();
    this.logger.info(`Current URL after navigation: ${this.sanitizeUrl(currentUrl)}`);

    // Primary verification: Check for app page URL pattern
    const isFoundryPage = /\/foundry\/page\/[a-f0-9]+/.test(currentUrl);
    if (!isFoundryPage) {
      throw new Error(`Expected Foundry app page URL pattern, but got: ${this.sanitizeUrl(currentUrl)}`);
    }

    this.logger.success(`Successfully navigated to Foundry app page: ${this.sanitizeUrl(currentUrl)}`);

    // Wait for app to load - check for navigation tabs or main content
    try {
      const allJobsTab = this.page.getByRole('tab', { name: /all jobs/i });
      const runHistoryTab = this.page.getByRole('tab', { name: /run history/i });
      const auditLogTab = this.page.getByRole('tab', { name: /audit log/i });

      // At least one navigation tab should be present
      if (
        await this.elementExists(allJobsTab, 3000) ||
        await this.elementExists(runHistoryTab, 3000) ||
        await this.elementExists(auditLogTab, 3000)
      ) {
        this.logger.success('Rapid Response app loaded successfully with navigation tabs');
        return;
      }
    } catch (error) {
      this.logger.warn('App navigation tabs not immediately visible - may still be loading');
    }

    this.logger.success(`Rapid Response app navigation completed: ${this.sanitizeUrl(currentUrl)}`);
  }

  /**
   * Navigate to Rapid Response app and install if needed (use for first test only)
   */
  async navigateToApp(): Promise<void> {
    return this.withTiming(
      async () => {
        const appName = config.appName;

        // Try App catalog approach first
        this.logger.info(`Attempting to install app "${appName}" from App catalog`);

        let needsNavigation = false;
        try {
          await this.installAppFromCatalog(appName);

          // Check if we successfully navigated to the app page
          const currentUrl = this.page.url();
          if (!currentUrl.includes('/foundry/page/')) {
            // Installation succeeded but we're still on catalog page
            needsNavigation = true;
          }
        } catch (error) {
          // If app is already installed, we need to navigate to it
          if (error.message?.includes('already installed')) {
            this.logger.info('App is already installed, using installed app navigation');
            needsNavigation = true;
          } else {
            throw error;
          }
        }

        // If we need to navigate (app installed but not opened), use Custom Apps menu
        if (needsNavigation) {
          await this.accessExistingApp(appName);
        }

        // Verify the app loaded
        await this.verifyPageLoaded();
      },
      'Navigate to Rapid Response App'
    );
  }

  /**
   * Navigate directly to already installed app (used after first installation)
   *
   * This method should be used by tests 2+ in a serial test suite where the app
   * has already been installed by the first test.
   */
  async navigateToInstalledApp(): Promise<void> {
    return this.withTiming(
      async () => {
        const appName = config.appName;

        // Always use the "existing app" flow since app is already installed
        this.logger.info(`Navigating to already installed app "${appName}"`);
        await this.accessExistingApp(appName);

        // Verify the app loaded
        await this.verifyPageLoaded();
      },
      'Navigate to Installed App'
    );
  }

  /**
   * Install app from App catalog (used in both CI and local environments)
   */
  private async installAppFromCatalog(appName: string): Promise<void> {
    await this.navigateToPath('/foundry/app-catalog', 'App catalog page');

    const searchBox = this.page.getByRole('searchbox', { name: 'Search' });
    await searchBox.fill(appName);
    await this.page.keyboard.press('Enter');

    // Wait for search results to load
    await this.page.waitForLoadState('networkidle');

    // Check if app exists in catalog
    const appLink = this.page.getByRole('link', { name: appName, exact: true });

    try {
      await expect(appLink).toBeVisible({ timeout: 3000 });
      this.logger.success(`Found app "${appName}" in catalog`);
    } catch (error) {
      // Try refresh and retry
      this.logger.debug(`App not immediately visible, refreshing...`);
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');

      const refreshedSearchBox = this.page.getByRole('searchbox', { name: 'Search' });
      await refreshedSearchBox.fill(appName);
      await this.page.keyboard.press('Enter');
      await this.page.waitForLoadState('networkidle');

      const refreshedAppLink = this.page.getByRole('link', { name: appName, exact: true });
      await expect(refreshedAppLink).toBeVisible({ timeout: 10000 });
      this.logger.success(`Found app "${appName}" in catalog after refresh`);
    }

    await appLink.click();

    // Wait for navigation to app details page
    await this.page.waitForURL(/\/foundry\/app-catalog\/[^\/]+$/, { timeout: 10000 });

    await this.handleAppInstallation(appName);
  }

  /**
   * Handle app installation or opening already installed app
   */
  private async handleAppInstallation(appName: string): Promise<void> {
    this.logger.step('Checking app installation status');

    // Wait for page to be fully loaded
    await this.page.waitForLoadState('networkidle');
    await this.waiter.delay(2000);

    // Check if app is already installed by looking for "Installed" status indicator
    // Use exact match to avoid matching "Not installed"
    const installedStatus = this.page.getByText('Installed', { exact: true }).first();
    const isInstalled = await this.elementExists(installedStatus, 2000);

    if (isInstalled) {
      this.logger.info(`App "${appName}" is already installed`);
      // When already installed, click the three-dot menu to find Open option
      const menuButton = this.page.locator('button[aria-label="More actions"]').or(
        this.page.locator('button').filter({ hasText: /^$/ }).last() // Three-dot button might be empty
      );

      if (await this.elementExists(menuButton, 2000)) {
        await menuButton.click();
        await this.waiter.delay(500);

        // Look for Open option in menu
        const openOption = this.page.locator('[role="menuitem"]').filter({ hasText: /open/i });
        if (await this.elementExists(openOption, 2000)) {
          await openOption.click();
          await this.waiter.delay(2000);
          this.logger.success('Opened installed app from menu');
          return;
        }
      }

      // If menu approach doesn't work, try direct navigation via Custom Apps
      this.logger.info('Menu approach failed, will use Custom Apps navigation');
      throw new Error('App already installed - use navigateToInstalledApp() instead');
    }

    // Check for install link (app not installed)
    const installLink = this.page.locator('a[href$="/install"]');

    if (await this.elementExists(installLink, 2000)) {
      this.logger.info(`Installing app "${appName}"`);
      await installLink.click();

      // Handle permissions modal that appears during installation
      await this.handleInstallPermissionsModal(appName);

      // Wait for installation to complete
      await this.waitForInstallation(appName);

      // Scroll to top to see the button
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await this.waiter.delay(1000);

      // Try multiple approaches to open the app after installation
      // 1. Look for "Open app" button (most direct)
      const openAppButton = this.page.getByRole('button', { name: /open app/i });
      if (await this.elementExists(openAppButton, 2000)) {
        this.logger.info('Found "Open app" button, clicking it');
        await openAppButton.click();
        await this.waiter.delay(2000);
        this.logger.success(`App "${appName}" installed and opened successfully`);
        return;
      }

      // 2. Try the three-dot menu approach
      const menuButton = this.page.locator('button[aria-label="More actions"]').first();
      if (await this.elementExists(menuButton, 3000)) {
        this.logger.info('Trying menu button approach');
        await menuButton.click();
        await this.waiter.delay(500);

        const openOption = this.page.locator('[role="menuitem"]').filter({ hasText: /open/i });
        if (await this.elementExists(openOption, 5000)) {
          await openOption.click();
          await this.waiter.delay(2000);
          this.logger.success(`App "${appName}" installed and opened successfully`);
          return;
        }
      }

      // 3. If neither worked, the app is installed but we'll navigate via Custom Apps menu
      this.logger.info('App installed but could not open directly - will use Custom Apps navigation');
      this.logger.success(`App "${appName}" installed successfully`);
    } else {
      // Take screenshot for debugging
      await this.page.screenshot({ path: 'test-results/app-details-page.png', fullPage: true });
      throw new Error(`Could not find Install button for "${appName}". Check test-results/app-details-page.png`);
    }
  }

  /**
   * Handle the permissions modal that appears during app installation
   */
  private async handleInstallPermissionsModal(appName: string): Promise<void> {
    this.logger.step('Handling installation permissions modal');

    // Wait for modal to appear
    const modalHeading = this.page.getByRole('heading', { name: `Install ${appName}` });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });
    this.logger.info('Permissions modal appeared');

    // Scroll to bottom of modal to reveal buttons
    await this.page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        modal.scrollTop = modal.scrollHeight;
      }
    });
    await this.waiter.delay(1000);

    // Look for Install button in the modal (try multiple patterns)
    let installButton = this.page.getByRole('button', { name: /^install$/i });

    // If not found, try looking for any button with "install" in it
    if (!(await this.elementExists(installButton, 2000))) {
      installButton = this.page.getByRole('button').filter({ hasText: /install/i }).first();
    }

    await expect(installButton).toBeVisible({ timeout: 5000 });
    await installButton.click();
    this.logger.success('Clicked install button in permissions modal');

    // Wait for modal to close
    await this.waiter.delay(2000);
  }

  /**
   * Wait for app installation to complete
   */
  private async waitForInstallation(appName: string, timeout: number = 30000): Promise<void> {
    this.logger.info('Waiting for installation to complete...');

    // Wait for the page to update and show "Installed" status (exact match to avoid "Not installed")
    const installedIndicator = this.page.getByText('Installed', { exact: true }).first();

    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      // Check if "Installed" text appears (indicates installation completed)
      if (await this.elementExists(installedIndicator, 1000)) {
        this.logger.success('Installation completed - app shows as installed');
        return;
      }

      // Also check if "Open app" button appeared (alternative completion indicator)
      const openButton = this.page.getByRole('button', { name: /open app/i });
      if (await this.elementExists(openButton, 1000)) {
        this.logger.success('Installation completed - Open app button available');
        return;
      }

      await this.waiter.delay(1000);
    }

    throw new Error(`Installation timeout after ${timeout}ms`);
  }

  /**
   * Access existing installed app
   */
  private async accessExistingApp(appName: string): Promise<void> {
    // Try Custom Apps navigation first (most likely path)
    try {
      await this.navigateViaCustomApps();
      return;
    } catch (error) {
      this.logger.warn('Custom apps navigation failed, trying App manager approach');
    }

    // Fallback: Try App manager approach
    await this.navigateToPath('/foundry/app-manager', 'App manager page');

    const appLink = this.page.getByRole('link', { name: appName, exact: true });

    try {
      await expect(appLink).toBeVisible({ timeout: 3000 });
      this.logger.success(`Found app in manager: ${appName}`);
      await appLink.click();

      // Click "View in catalog"
      const viewCatalogLink = this.page.getByRole('link', { name: 'View in catalog' });
      await expect(viewCatalogLink).toBeVisible({ timeout: 5000 });
      await viewCatalogLink.click();

      // Click "Open app"
      const openButton = this.page.getByRole('button', { name: 'Open app' });
      await expect(openButton).toBeVisible({ timeout: 5000 });
      await openButton.click();
      this.logger.success('Accessed existing app successfully');

    } catch (error) {
      throw new Error(`App "${appName}" not found. Please ensure it's deployed and installed.`);
    }
  }

  /**
   * Navigate via Custom apps menu
   */
  private async navigateViaCustomApps(): Promise<void> {
    this.logger.step('Attempting navigation via Custom apps menu');

    await this.navigateToPath('/foundry/home', 'Foundry home page');

    const menuButton = this.page.getByRole('button', { name: 'Menu' });
    await expect(menuButton).toBeVisible({ timeout: 10000 });
    await menuButton.click();

    const customAppsButton = this.page.getByRole('button', { name: 'Custom apps' });
    await expect(customAppsButton).toBeVisible({ timeout: 10000 });
    await customAppsButton.click();

    const appName = config.appName;
    const appButton = this.page.getByRole('button', { name: appName, exact: false }).first();

    await expect(appButton).toBeVisible({ timeout: 5000 });

    // Click the app link
    const appLinks = this.page.getByRole('link').filter({ hasText: /all jobs|rapid response/i });
    const firstLink = appLinks.first();
    await expect(firstLink).toBeVisible({ timeout: 5000 });
    await firstLink.click();

    this.logger.success('Successfully navigated via Custom apps menu');
  }

  /**
   * Navigate to All Jobs page
   */
  async navigateToAllJobs(): Promise<void> {
    this.logger.step('Navigate to All Jobs page');

    // The app content is in an iframe - find it first
    const frame = this.page.frameLocator('iframe').first();

    // Look for the tab by text (tabs might not have proper ARIA roles)
    const allJobsTab = frame.locator('text="All jobs"').first();

    await allJobsTab.click();
    await this.waiter.delay(500);

    this.logger.success('Navigated to All Jobs page');
  }

  /**
   * Navigate to Run History page
   */
  async navigateToRunHistory(): Promise<void> {
    this.logger.step('Navigate to Run History page');

    // The app content is in an iframe - find it first
    const frame = this.page.frameLocator('iframe').first();

    // Look for the tab by text (tabs might not have proper ARIA roles)
    const runHistoryTab = frame.locator('text="Run history"').first();

    await runHistoryTab.click();
    await this.waiter.delay(500);

    this.logger.success('Navigated to Run History page');
  }

  /**
   * Navigate to Audit Log page
   */
  async navigateToAuditLog(): Promise<void> {
    this.logger.step('Navigate to Audit Log page');

    // The app content is in an iframe - find it first
    const frame = this.page.frameLocator('iframe').first();

    // Look for the tab by text (tabs might not have proper ARIA roles)
    const auditLogTab = frame.locator('text="Audit log"').first();

    await auditLogTab.click();
    await this.waiter.delay(500);

    this.logger.success('Navigated to Audit Log page');
  }

  /**
   * Uninstall the app (cleanup after tests)
   */
  async uninstallApp(): Promise<void> {
    return this.withTiming(
      async () => {
        const appName = config.appName;

        try {
          // Navigate to app catalog
          await this.navigateToPath('/foundry/app-catalog', 'App catalog page');

          // Search for the app
          const searchBox = this.page.getByRole('searchbox', { name: 'Search' });
          await searchBox.fill(appName);
          await this.page.keyboard.press('Enter');
          await this.page.waitForLoadState('networkidle');

          // Find the app link
          const appLink = this.page.getByRole('link', { name: appName, exact: true });

          // Check if app exists and is installed
          const appExists = await appLink.isVisible({ timeout: 5000 });
          if (!appExists) {
            this.logger.info(`App "${appName}" not found in catalog - may already be uninstalled`);
            return;
          }

          // Click on app to go to details page
          await appLink.click();
          await this.page.waitForURL(/\/foundry\/app-catalog\/[^\/]+$/, { timeout: 10000 });

          // Check if app is installed
          const installedStatus = this.page.getByText('Installed', { exact: true }).first();
          const isInstalled = await this.elementExists(installedStatus, 3000);

          if (!isInstalled) {
            this.logger.info(`App "${appName}" is already uninstalled`);
            return;
          }

          // Click open menu (three dots)
          const openMenuButton = this.page.getByRole('button', { name: 'Open menu' });
          await expect(openMenuButton).toBeVisible({ timeout: 5000 });
          await openMenuButton.click();

          // Click uninstall
          const uninstallMenuItem = this.page.getByRole('menuitem', { name: 'Uninstall app' });
          await expect(uninstallMenuItem).toBeVisible({ timeout: 5000 });
          await uninstallMenuItem.click();

          // Confirm uninstall
          const uninstallButton = this.page.getByRole('button', { name: 'Uninstall' });
          await expect(uninstallButton).toBeVisible({ timeout: 5000 });
          await uninstallButton.click();

          // Wait for success message
          const successMessage = this.page.getByText(/has been uninstalled/i);
          await expect(successMessage).toBeVisible({ timeout: 10000 });

          this.logger.success(`Successfully uninstalled app "${appName}"`);

        } catch (error) {
          this.logger.warn(`Failed to uninstall app: ${error.message}`);
          // Don't throw error - this is cleanup, we don't want to fail tests
        }
      },
      'Uninstall Rapid Response app'
    );
  }
}
