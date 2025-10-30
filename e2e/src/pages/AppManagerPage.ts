/**
 * AppManagerPage - App Manager interactions
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AppManagerPage extends BasePage {
  constructor(page: Page) {
    super(page, 'AppManagerPage');
  }

  protected getPagePath(): string {
    return '/foundry/app-manager';
  }

  protected async verifyPageLoaded(): Promise<void> {
    await this.waiter.waitForVisible(
      this.page.locator('text=App Manager').or(this.page.locator('h1:has-text("Apps")')),
      { description: 'App Manager page' }
    );

    this.logger.success('App Manager page loaded successfully');
  }

  /**
   * Check if app is listed in App Manager
   */
  async isAppListed(appName: string): Promise<boolean> {
    this.logger.step(`Check if app '${appName}' is listed`);

    const appCard = this.page.locator(`text=${appName}`).first();
    const exists = await this.elementExists(appCard, 3000);

    this.logger.info(`App '${appName}' ${exists ? 'found' : 'not found'} in App Manager`);
    return exists;
  }

  /**
   * Click on app to view details
   */
  async viewAppDetails(appName: string): Promise<void> {
    this.logger.step(`View details for app '${appName}'`);

    const appLink = this.page.getByRole('link', { name: appName }).first();
    await this.smartClick(appLink, `App '${appName}' link`);

    this.logger.success(`Viewing details for '${appName}'`);
  }
}
