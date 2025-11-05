/**
 * AppCatalogPage - App installation and management
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { RetryHandler } from '../utils/SmartWaiter';
import { config } from '../config/TestConfig';

export class AppCatalogPage extends BasePage {
  constructor(page: Page) {
    super(page, 'AppCatalogPage');
  }

  protected getPagePath(): string {
    return '/foundry/app-catalog';
  }

  protected async verifyPageLoaded(): Promise<void> {
    await this.waiter.waitForVisible(
      this.page.locator('text=App Catalog').or(this.page.locator('text=Apps')),
      { description: 'App Catalog page' }
    );

    this.logger.success('App Catalog page loaded successfully');
  }

  /**
   * Search for app in catalog and navigate to its page
   */
  private async searchAndNavigateToApp(appName: string): Promise<void> {
    this.logger.info(`Searching for app '${appName}' in catalog`);

    await this.navigateToPath('/foundry/app-catalog', 'App catalog page');

    const searchBox = this.page.getByRole('searchbox', { name: 'Search' });
    await searchBox.fill(appName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');

    const appLink = this.page.getByRole('link', { name: appName, exact: true });

    try {
      await this.waiter.waitForVisible(appLink, {
        description: `App '${appName}' link in catalog`,
        timeout: 10000
      });
      this.logger.success(`Found app '${appName}' in catalog`);
      await this.smartClick(appLink, `App '${appName}' link`);
      await this.page.waitForLoadState('networkidle');
    } catch (error) {
      throw new Error(`Could not find app '${appName}' in catalog. Make sure the app is deployed.`);
    }
  }

  /**
   * Check if app is installed
   */
  async isAppInstalled(appName: string): Promise<boolean> {
    this.logger.step(`Check if app '${appName}' is installed`);

    // Search for and navigate to the app's catalog page
    await this.searchAndNavigateToApp(appName);

    // Check for installation indicators on the app's page
    // Simple check: if "Install now" link exists, app is NOT installed
    const installLink = this.page.getByRole('link', { name: 'Install now' });
    const hasInstallLink = await this.elementExists(installLink, 3000);

    const isInstalled = !hasInstallLink;
    this.logger.info(`App '${appName}' installation status: ${isInstalled ? 'Installed' : 'Not installed'}`);

    return isInstalled;
  }

  /**
   * Install app if not already installed
   */
  async installApp(appName: string): Promise<boolean> {
    this.logger.step(`Install app '${appName}'`);

    const isInstalled = await this.isAppInstalled(appName);
    if (isInstalled) {
      this.logger.info(`App '${appName}' is already installed`);
      return false;
    }

    // Click Install now link
    this.logger.info('App not installed, looking for Install now link');
    const installLink = this.page.getByRole('link', { name: 'Install now' });

    await this.waiter.waitForVisible(installLink, { description: 'Install now link' });
    await this.smartClick(installLink, 'Install now link');
    this.logger.info('Clicked Install now, waiting for install page to load');

    // Wait for URL to change to install page and page to stabilize
    await this.page.waitForURL(/\/foundry\/app-catalog\/[^\/]+\/install$/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');

    // Handle permissions dialog
    await this.handlePermissionsDialog();

    // Check for ServiceNow configuration screen
    await this.configureServiceNowIfNeeded();

    // Click final Install app button
    await this.clickInstallAppButton();

    // Wait for installation to complete
    await this.waitForInstallation(appName);

    this.logger.success(`App '${appName}' installed successfully`);
    return true;
  }

  /**
   * Handle permissions dialog if present
   */
  private async handlePermissionsDialog(): Promise<void> {
    const acceptButton = this.page.getByRole('button', { name: /accept.*continue/i });

    if (await this.elementExists(acceptButton, 3000)) {
      this.logger.info('Permissions dialog detected, accepting');
      await this.smartClick(acceptButton, 'Accept and continue button');
      await this.waiter.delay(2000);
    }
  }

  /**
   * Configure ServiceNow API integration if configuration form is present
   */
  private async configureServiceNowIfNeeded(): Promise<void> {
    this.logger.info('Checking if ServiceNow API configuration is required...');

    // Check if there are text input fields (configuration form)
    const textInputs = this.page.locator('input[type="text"]');

    try {
      await textInputs.first().waitFor({ state: 'visible', timeout: 15000 });
      const count = await textInputs.count();
      this.logger.info(`ServiceNow configuration form detected with ${count} input fields`);
    } catch (error) {
      this.logger.info('No ServiceNow configuration required - no input fields found');
      return;
    }

    this.logger.info('ServiceNow configuration required, filling dummy values');

    // Fill configuration fields using index-based selection
    // Field 1: Name
    const nameField = this.page.locator('input[type="text"]').first();
    await nameField.fill('ServiceNow Test Instance');
    this.logger.debug('Filled Name field');

    // Field 2: Instance (the {instance} part of {instance}.service-now.com)
    const instanceField = this.page.locator('input[type="text"]').nth(1);
    await instanceField.fill('dev12345');
    this.logger.debug('Filled Instance field');

    // Field 3: Username
    const usernameField = this.page.locator('input[type="text"]').nth(2);
    await usernameField.fill('dummy_user');
    this.logger.debug('Filled Username field');

    // Field 4: Password (must be >8 characters)
    const passwordField = this.page.locator('input[type="password"]').first();
    await passwordField.fill('DummyPassword123');
    this.logger.debug('Filled Password field');

    // Wait for network to settle after filling form
    await this.page.waitForLoadState('networkidle');

    this.logger.success('ServiceNow API configuration completed');
  }

  /**
   * Click the final "Save and install" button
   */
  private async clickInstallAppButton(): Promise<void> {
    const installButton = this.page.getByRole('button', { name: 'Save and install' })
      .or(this.page.getByRole('button', { name: 'Install app' }));

    await this.waiter.waitForVisible(installButton, { description: 'Install button' });

    // Wait for button to be enabled
    await installButton.waitFor({ state: 'visible', timeout: 10000 });
    await installButton.waitFor({ state: 'attached', timeout: 5000 });

    // Simple delay for form to enable button
    await this.waiter.delay(1000);

    await this.smartClick(installButton, 'Install button');
    this.logger.info('Clicked Save and install button');
  }

  /**
   * Wait for installation to complete
   */
  private async waitForInstallation(appName: string): Promise<void> {
    this.logger.info('Waiting for installation to complete...');

    // Wait for URL to change or network to settle
    await Promise.race([
      this.page.waitForURL(/\/foundry\/(app-catalog|home)/, { timeout: 15000 }),
      this.page.waitForLoadState('networkidle', { timeout: 15000 })
    ]).catch(() => {});

    // Look for "installing" message
    const installingMessage = this.page.getByText(/installing/i).first();

    try {
      await installingMessage.waitFor({ state: 'visible', timeout: 30000 });
      this.logger.success('Installation started - success message appeared');
    } catch (error) {
      this.logger.warn('Installation message not visible, assuming installation succeeded');
    }
  }

  /**
   * Navigate to app via Custom Apps menu
   */
  async navigateToAppViaCustomApps(appName: string): Promise<void> {
    this.logger.step(`Navigate to app '${appName}' via Custom Apps`);

    return RetryHandler.withPlaywrightRetry(
      async () => {
        // Navigate to Foundry home
        await this.navigateToPath('/foundry/home', 'Foundry home page');

        // Open hamburger menu
        const menuButton = this.page.getByRole('button', { name: 'Menu' });
        await this.smartClick(menuButton, 'Menu button');

        // Click Custom apps
        const customAppsButton = this.page.getByRole('button', { name: 'Custom apps' });
        await this.smartClick(customAppsButton, 'Custom apps button');

        // Find and click the app
        const appButton = this.page.getByRole('button', { name: appName, exact: false }).first();
        if (await this.elementExists(appButton, 3000)) {
          await this.smartClick(appButton, `App '${appName}' button`);
          await this.waiter.delay(1000);

          this.logger.success(`Navigated to app '${appName}' via Custom Apps`);
          return;
        }

        throw new Error(`App '${appName}' not found in Custom Apps menu`);
      },
      `Navigate to app via Custom Apps`
    );
  }

  /**
   * Uninstall app
   */
  async uninstallApp(appName: string): Promise<void> {
    this.logger.step(`Uninstall app '${appName}'`);

    try {
      // Search for and navigate to the app's catalog page
      await this.searchAndNavigateToApp(appName);

      // Check if app is actually installed by looking for "Install now" link
      // If "Install now" link exists, app is NOT installed
      const installLink = this.page.getByRole('link', { name: 'Install now' });
      const hasInstallLink = await this.elementExists(installLink, 3000);

      if (hasInstallLink) {
        this.logger.info(`App '${appName}' is already uninstalled`);
        return;
      }

      // Click the 3-dot menu button
      const openMenuButton = this.page.getByRole('button', { name: 'Open menu' });
      await this.waiter.waitForVisible(openMenuButton, { description: 'Open menu button' });
      await this.smartClick(openMenuButton, 'Open menu button');

      // Click "Uninstall app" menuitem
      const uninstallMenuItem = this.page.getByRole('menuitem', { name: 'Uninstall app' });
      await this.waiter.waitForVisible(uninstallMenuItem, { description: 'Uninstall app menuitem' });
      await this.smartClick(uninstallMenuItem, 'Uninstall app menuitem');

      // Confirm uninstallation in modal
      const uninstallButton = this.page.getByRole('button', { name: 'Uninstall' });
      await this.waiter.waitForVisible(uninstallButton, { description: 'Uninstall confirmation button' });
      await this.smartClick(uninstallButton, 'Uninstall button');

      // Wait for success message
      const successMessage = this.page.getByText(/has been uninstalled/i);
      await this.waiter.waitForVisible(successMessage, {
        description: 'Uninstall success message',
        timeout: 30000
      });

      this.logger.success(`App '${appName}' uninstalled successfully`);

    } catch (error) {
      this.logger.warn(`Failed to uninstall app '${appName}': ${error.message}`);
      throw error;
    }
  }
}
