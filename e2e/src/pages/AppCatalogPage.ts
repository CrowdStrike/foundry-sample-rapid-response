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
   * Check if app is installed
   */
  async isAppInstalled(appName: string): Promise<boolean> {
    this.logger.step(`Check if app '${appName}' is installed`);

    // Try different methods to detect installation status
    const installedText = this.page.locator('text=Installed').first();
    const openButton = this.page.getByRole('button', { name: /open|launch/i });

    const hasInstalledText = await this.elementExists(installedText, 2000);
    const hasOpenButton = await this.elementExists(openButton, 2000);

    const isInstalled = hasInstalledText || hasOpenButton;
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

    // Look for Install button
    const installButton = this.page.getByRole('button', { name: 'Install' }).first();

    if (await this.elementExists(installButton, 3000)) {
      await this.smartClick(installButton, 'Install button');
      await this.waiter.delay(2000);

      // Wait for installation to complete
      await this.waitForInstallation(appName);

      this.logger.success(`App '${appName}' installed successfully`);
      return true;
    }

    this.logger.warn(`Could not find Install button for '${appName}'`);
    return false;
  }

  /**
   * Wait for installation to complete
   */
  private async waitForInstallation(appName: string, timeout: number = 30000): Promise<void> {
    this.logger.info('Waiting for installation to complete...');

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const isInstalled = await this.isAppInstalled(appName);
      if (isInstalled) {
        this.logger.success('Installation completed');
        return;
      }

      await this.waiter.delay(1000);
    }

    throw new Error(`Installation timeout after ${timeout}ms`);
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

    const uninstallButton = this.page.getByRole('button', { name: 'Uninstall' }).first();

    if (await this.elementExists(uninstallButton, 3000)) {
      await this.smartClick(uninstallButton, 'Uninstall button');

      // Confirm uninstallation if prompted
      const confirmButton = this.page.getByRole('button', { name: 'Confirm' });
      if (await this.elementExists(confirmButton, 2000)) {
        await this.smartClick(confirmButton, 'Confirm button');
      }

      await this.waiter.delay(2000);
      this.logger.success(`App '${appName}' uninstalled successfully`);
    } else {
      this.logger.warn(`Could not find Uninstall button for '${appName}'`);
    }
  }
}
