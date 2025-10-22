/**
 * SmartWaiter - Intelligent waiting utilities for Playwright tests
 *
 * Provides condition-based waiting with retry logic instead of hard timeouts
 */

import { Locator, Page } from '@playwright/test';
import { Logger } from './Logger';

export type ElementState = 'visible' | 'attached' | 'detached' | 'hidden';

export interface WaitOptions {
  timeout?: number;
  state?: ElementState;
  description?: string;
}

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
}

export class SmartWaiter {
  private logger: Logger;
  private defaultTimeout: number;

  constructor(logger: Logger, defaultTimeout: number = 30000) {
    this.logger = logger;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Wait for element to be in specified state
   */
  async waitForVisible(
    locator: Locator,
    options: WaitOptions = {}
  ): Promise<void> {
    const { timeout = this.defaultTimeout, state = 'visible', description } = options;
    const element = description || 'element';

    this.logger.waiting(element, timeout);

    try {
      await locator.waitFor({ state, timeout });
      this.logger.debug(`${element} is ${state}`);
    } catch (error) {
      const errorMessage = `Timeout waiting for ${element} to be ${state} (${timeout}ms)`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Wait for page navigation to complete
   */
  async waitForNavigation(
    page: Page,
    url: string | RegExp,
    timeout: number = this.defaultTimeout
  ): Promise<void> {
    this.logger.waiting(`navigation to ${url}`, timeout);

    try {
      await page.waitForURL(url, { timeout });
      this.logger.debug(`Navigation to ${url} completed`);
    } catch (error) {
      const errorMessage = `Timeout waiting for navigation to ${url} (${timeout}ms)`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(
    page: Page,
    timeout: number = this.defaultTimeout
  ): Promise<void> {
    this.logger.waiting('network idle', timeout);

    try {
      await page.waitForLoadState('networkidle', { timeout });
      this.logger.debug('Network is idle');
    } catch (error) {
      // Network idle timeout is not critical, just log and continue
      this.logger.debug('Network idle timeout (non-critical)');
    }
  }

  /**
   * Wait for element with custom condition
   */
  async waitForCondition(
    condition: () => Promise<boolean>,
    description: string,
    timeout: number = this.defaultTimeout
  ): Promise<void> {
    this.logger.waiting(description, timeout);

    const startTime = Date.now();
    const checkInterval = 500;

    while (Date.now() - startTime < timeout) {
      try {
        if (await condition()) {
          this.logger.debug(`Condition met: ${description}`);
          return;
        }
      } catch (error) {
        // Condition check failed, continue retrying
      }

      await this.delay(checkInterval);
    }

    const errorMessage = `Timeout waiting for condition: ${description} (${timeout}ms)`;
    this.logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Delay execution
   */
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * RetryHandler - Provides retry logic for flaky operations
 */
export class RetryHandler {
  /**
   * Retry an operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    description: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxAttempts = 3, delayMs = 1000, backoff = true } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(
            `Failed after ${maxAttempts} attempts: ${description}\n` +
            `Last error: ${error}`
          );
        }

        const delay = backoff ? delayMs * attempt : delayMs;
        console.log(
          `⚠️  Attempt ${attempt}/${maxAttempts} failed for ${description}, ` +
          `retrying in ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Retry logic failed for: ${description}`);
  }

  /**
   * Retry with Playwright-specific error handling
   */
  static async withPlaywrightRetry<T>(
    operation: () => Promise<T>,
    description: string,
    options: RetryOptions = {}
  ): Promise<T> {
    return this.withRetry(operation, description, options);
  }
}

/**
 * Helper function to create a SmartWaiter instance
 */
export function createWaiter(logger: Logger, timeout?: number): SmartWaiter {
  return new SmartWaiter(logger, timeout);
}
