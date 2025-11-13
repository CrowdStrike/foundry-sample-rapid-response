/**
 * FoundryHomePage - Foundry home page and navigation
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class FoundryHomePage extends BasePage {
  constructor(page: Page) {
    super(page, 'FoundryHomePage');
  }

  protected getPagePath(): string {
    return '/foundry/home';
  }

  protected async verifyPageLoaded(): Promise<void> {
    // Wait for Foundry home page to load
    await this.waiter.waitForVisible(
      this.page.locator('text=Foundry').or(this.page.locator('[aria-label="Foundry"]')),
      { description: 'Foundry home page' }
    );

    this.logger.success('Foundry home page loaded successfully');
  }

  /**
   * Open the hamburger menu
   */
  async openMenu(): Promise<void> {
    this.logger.step('Open hamburger menu');

    const menuButton = this.page.getByTestId('nav-trigger');
    await this.smartClick(menuButton, 'Menu button');
    await this.waiter.delay(500);

    this.logger.success('Menu opened');
  }

  /**
   * Navigate to Custom Apps
   */
  async navigateToCustomApps(): Promise<void> {
    this.logger.step('Navigate to Custom Apps');

    await this.openMenu();

    const customAppsButton = this.page.getByRole('button', { name: 'Custom apps' });
    await this.smartClick(customAppsButton, 'Custom apps button');
    await this.waiter.delay(500);

    this.logger.success('Custom Apps menu opened');
  }

  /**
   * Navigate to App Manager
   */
  async navigateToAppManager(): Promise<void> {
    this.logger.step('Navigate to App Manager');

    await this.navigateToPath('/foundry/app-manager', 'App manager page');
  }
}
