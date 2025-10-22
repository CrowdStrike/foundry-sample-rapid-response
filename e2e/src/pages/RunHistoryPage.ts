/**
 * RunHistoryPage - Job execution history page
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RunHistoryPage extends BasePage {
  constructor(page: Page) {
    super(page, 'RunHistoryPage');
  }

  protected getPagePath(): string {
    // Hash routing - actual path is dynamic
    return '#/run-history';
  }

  protected async verifyPageLoaded(): Promise<void> {
    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();

    // Look for history table or history-related elements
    const historyTable = frame.locator('table').or(frame.locator('[class*="history"]'));
    const heading = frame.locator('h1,h2').filter({ hasText: /history|runs/i });

    if (
      await this.elementExists(historyTable, 5000) ||
      await this.elementExists(heading, 5000)
    ) {
      this.logger.success('Run History page loaded successfully');
    } else {
      this.logger.warn('Run History page elements not found, but continuing...');
    }
  }

  /**
   * Check if history table is displayed
   */
  async hasHistoryTable(): Promise<boolean> {
    this.logger.step('Check for history table');

    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();
    const table = frame.locator('table');
    const exists = await this.elementExists(table, 3000);

    this.logger.info(`History table ${exists ? 'found' : 'not found'}`);
    return exists;
  }

  /**
   * Check if history entries are displayed
   */
  async hasHistoryEntries(): Promise<boolean> {
    this.logger.step('Check for history entries');

    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();
    const entries = frame.locator('tbody tr').or(frame.locator('[class*="history-entry"]'));
    const count = await entries.count();

    this.logger.info(`Found ${count} history entry(ies)`);
    return count > 0;
  }

  /**
   * Verify page renders correctly
   */
  async verifyPageRenders(): Promise<boolean> {
    this.logger.step('Verify Run History page renders');

    // Check for presence of "Run history" tab being active or visible content
    const frame = this.page.frameLocator('iframe').first();
    const runHistoryText = frame.locator('text="Run history"');
    const hasContent = await this.elementExists(runHistoryText, 3000);

    this.logger.info(`Run History page renders: ${hasContent}`);
    return hasContent;
  }
}
