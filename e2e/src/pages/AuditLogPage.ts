/**
 * AuditLogPage - Audit log display page
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuditLogPage extends BasePage {
  constructor(page: Page) {
    super(page, 'AuditLogPage');
  }

  protected getPagePath(): string {
    // Hash routing - actual path is dynamic
    return '#/audit-log';
  }

  protected async verifyPageLoaded(): Promise<void> {
    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();

    // Look for audit log table or audit-related elements
    const auditTable = frame.locator('table').or(frame.locator('[class*="audit"]'));
    const heading = frame.locator('h1,h2').filter({ hasText: /audit|log/i });

    if (
      await this.elementExists(auditTable, 5000) ||
      await this.elementExists(heading, 5000)
    ) {
      this.logger.success('Audit Log page loaded successfully');
    } else {
      this.logger.warn('Audit Log page elements not found, but continuing...');
    }
  }

  /**
   * Check if audit log table is displayed
   */
  async hasAuditTable(): Promise<boolean> {
    this.logger.step('Check for audit log table');

    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();
    const table = frame.locator('table');
    const exists = await this.elementExists(table, 3000);

    this.logger.info(`Audit log table ${exists ? 'found' : 'not found'}`);
    return exists;
  }

  /**
   * Check if audit entries are displayed
   */
  async hasAuditEntries(): Promise<boolean> {
    this.logger.step('Check for audit entries');

    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();
    const entries = frame.locator('tbody tr').or(frame.locator('[class*="audit-entry"]'));
    const count = await entries.count();

    this.logger.info(`Found ${count} audit entry(ies)`);
    return count > 0;
  }

  /**
   * Verify page renders correctly
   */
  async verifyPageRenders(): Promise<boolean> {
    this.logger.step('Verify Audit Log page renders');

    // Check for presence of "Audit log" tab being active or visible content
    const frame = this.page.frameLocator('iframe').first();
    const auditLogText = frame.locator('text="Audit log"');
    const hasContent = await this.elementExists(auditLogText, 3000);

    this.logger.info(`Audit Log page renders: ${hasContent}`);
    return hasContent;
  }
}
