/**
 * AllJobsPage - Jobs listing and management page
 */

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AllJobsPage extends BasePage {
  constructor(page: Page) {
    super(page, 'AllJobsPage');
  }

  protected getPagePath(): string {
    // Hash routing - actual path is dynamic
    return '#/all-jobs';
  }

  protected async verifyPageLoaded(): Promise<void> {
    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();

    // Look for Create Job button or job list container
    const createJobButton = frame.locator('button', { hasText: /create job/i });
    const jobsContainer = frame.locator('[class*="job"]').or(frame.locator('table'));

    if (
      await this.elementExists(createJobButton, 5000) ||
      await this.elementExists(jobsContainer, 5000)
    ) {
      this.logger.success('All Jobs page loaded successfully');
    } else {
      this.logger.warn('All Jobs page elements not found, but continuing...');
    }
  }

  /**
   * Check if Create Job button is present
   */
  async hasCreateJobButton(): Promise<boolean> {
    this.logger.step('Check for Create Job button');

    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();
    const createJobButton = frame.locator('button', { hasText: /create job/i });
    const exists = await this.elementExists(createJobButton, 3000);

    this.logger.info(`Create Job button ${exists ? 'found' : 'not found'}`);
    return exists;
  }

  /**
   * Click Create Job button
   */
  async clickCreateJob(): Promise<void> {
    this.logger.step('Click Create Job button');

    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();
    const createJobButton = frame.locator('button', { hasText: /create job/i });
    await createJobButton.click();
    await this.waiter.delay(1000);

    this.logger.success('Create Job button clicked');
  }

  /**
   * Check if jobs are displayed
   */
  async hasJobs(): Promise<boolean> {
    this.logger.step('Check for displayed jobs');

    // The app content is in an iframe
    const frame = this.page.frameLocator('iframe').first();
    const jobElements = frame.locator('[class*="job-"]').or(frame.locator('tbody tr'));
    const count = await jobElements.count();

    this.logger.info(`Found ${count} job(s) displayed`);
    return count > 0;
  }

  /**
   * Verify page renders correctly
   */
  async verifyPageRenders(): Promise<boolean> {
    this.logger.step('Verify All Jobs page renders');

    // Check for main page elements
    const hasButton = await this.hasCreateJobButton();
    const url = this.getCurrentUrl();
    const hasCorrectUrl = url.includes('all-jobs') || url.includes('path=%2F');

    const renders = hasButton || hasCorrectUrl;
    this.logger.info(`All Jobs page renders: ${renders}`);

    return renders;
  }
}
