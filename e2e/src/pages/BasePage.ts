/**
 * BasePage - Base class for all page objects
 *
 * Provides common functionality for navigation, waiting, clicking, and error handling
 */

import { Locator, Page } from '@playwright/test';
import { Logger, logger as globalLogger } from '../utils/Logger';
import { SmartWaiter, RetryHandler } from '../utils/SmartWaiter';
import { config } from '../config/TestConfig';

export abstract class BasePage {
  protected page: Page;
  protected logger: ReturnType<Logger['forPage']>;
  public waiter: SmartWaiter;

  constructor(page: Page, context: string) {
    this.page = page;
    this.logger = globalLogger.forPage(context);
    this.waiter = new SmartWaiter(globalLogger, config.timeout);
  }

  /**
   * Get the path for this page (to be overridden by subclasses)
   */
  protected abstract getPagePath(): string;

  /**
   * Verify page has loaded correctly (to be overridden by subclasses)
   */
  protected abstract verifyPageLoaded(): Promise<void>;

  /**
   * Navigate to this page
   */
  async goto(): Promise<void> {
    const path = this.getPagePath();
    const url = `${config.baseUrl}${path}`;

    this.logger.navigate(url);
    this.logger.startTimer('navigation');

    await this.page.goto(url);
    await this.verifyPageLoaded();

    this.logger.timed('navigation', `Navigate to ${this.constructor.name}`);
  }

  /**
   * Navigate to a specific path
   */
  protected async navigateToPath(path: string, description: string): Promise<void> {
    const url = `${config.baseUrl}${path}`;

    this.logger.navigate(url);
    await this.page.goto(url);
    await this.waiter.waitForNetworkIdle(this.page);

    this.logger.success(`Navigated to ${description}`);
  }

  /**
   * Smart click with retry logic and force option
   */
  protected async smartClick(
    locator: Locator,
    description: string,
    force: boolean = false
  ): Promise<void> {
    this.logger.click(description);

    await RetryHandler.withPlaywrightRetry(
      async () => {
        await this.waiter.waitForVisible(locator, {
          description,
          state: 'visible',
        });
        await locator.click({ force });
      },
      `Click ${description}`
    );
  }

  /**
   * Check if element exists without throwing
   */
  protected async elementExists(
    locator: Locator,
    timeout: number = 5000,
    state: 'visible' | 'attached' = 'visible'
  ): Promise<boolean> {
    try {
      await locator.waitFor({ state, timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current URL
   */
  public getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Sanitize URL for logging by masking sensitive IDs
   */
  protected sanitizeUrl(url: string): string {
    return url
      .replace(/\/foundry\/page\/[a-f0-9]+/g, '/foundry/page/[PAGE_ID]')
      .replace(/\/foundry\/app-catalog\/[a-f0-9]+/g, '/foundry/app-catalog/[APP_ID]')
      .replace(/\/foundry\/settings\/[a-f0-9]+/g, '/foundry/settings/[SETTING_ID]')
      .replace(/\?.*appId=[a-f0-9]+/g, '?appId=[APP_ID]')
      .replace(/pageId=[a-f0-9]+/g, 'pageId=[PAGE_ID]');
  }

  /**
   * Wait for URL pattern
   */
  protected async waitForUrlPattern(pattern: RegExp, timeout?: number): Promise<void> {
    await this.page.waitForURL(pattern, { timeout: timeout || config.timeout });
  }

  /**
   * Execute action with timing
   */
  protected async withTiming<T>(
    action: () => Promise<T>,
    description: string
  ): Promise<T> {
    this.logger.startTimer(description);
    const result = await action();
    this.logger.timed(description, description);
    return result;
  }

  /**
   * Take screenshot for debugging
   */
  protected async takeScreenshot(name: string): Promise<void> {
    const path = `test-results/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path, fullPage: true });
    this.logger.info(`Screenshot saved: ${path}`);
  }

  /**
   * Close any open modals/dialogs
   */
  protected async closeModals(): Promise<void> {
    const modalSelectors = [
      'button[aria-label="Close"]',
      'button:has-text("Cancel")',
      '[data-testid="close-button"]',
      '.modal-close',
    ];

    for (const selector of modalSelectors) {
      const modal = this.page.locator(selector);
      if (await this.elementExists(modal, 1000)) {
        await this.smartClick(modal, 'Close modal');
        await this.waiter.delay(500);
      }
    }
  }

  /**
   * Wait for element and get text
   */
  protected async getElementText(locator: Locator, description: string): Promise<string> {
    await this.waiter.waitForVisible(locator, { description });
    return locator.textContent() || '';
  }

  /**
   * Type into input field
   */
  protected async typeText(
    locator: Locator,
    text: string,
    description: string
  ): Promise<void> {
    this.logger.debug(`Type into ${description}: ${text}`);
    await this.waiter.waitForVisible(locator, { description });
    await locator.fill(text);
  }

  /**
   * Select option from dropdown
   */
  protected async selectOption(
    locator: Locator,
    value: string,
    description: string
  ): Promise<void> {
    this.logger.debug(`Select ${value} from ${description}`);
    await this.waiter.waitForVisible(locator, { description });
    await locator.selectOption(value);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Reload current page
   */
  async reload(): Promise<void> {
    this.logger.info('Reloading page');
    await this.page.reload();
    await this.verifyPageLoaded();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    this.logger.info('Going back');
    await this.page.goBack();
  }
}
