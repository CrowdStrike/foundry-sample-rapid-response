/**
 * Structured logging service for E2E tests
 * Provides consistent, searchable, and actionable logging
 */
export interface LogContext {
  page?: string;
  action?: string;
  element?: string;
  timeout?: number;
  attempt?: number;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'step';

export class Logger {
  private static _instance: Logger;
  private readonly isCI: boolean;
  private readonly isDebugMode: boolean;
  private stepCounter = 0;
  private timers: Map<string, number> = new Map();

  private constructor() {
    this.isCI = !!process.env.CI;
    this.isDebugMode = process.env.DEBUG === 'true';
  }

  public static getInstance(): Logger {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    return Logger._instance;
  }

  /**
   * Log a test step with clear visual indication
   */
  step(page: string, action: string, context: LogContext = {}): void {
    this.stepCounter++;
    const emoji = this.getStepEmoji(action);
    const message = `${emoji} [${this.stepCounter}] ${page}: ${action}`;

    this.log('step', message, { page, action, ...context });
  }

  /**
   * Log successful operations
   */
  success(message: string, context: LogContext = {}): void {
    this.log('info', `✅ ${message}`, context);
  }

  /**
   * Log warnings (non-blocking issues)
   */
  warn(message: string, context: LogContext = {}): void {
    this.log('warn', `⚠️ ${message}`, context);
  }

  /**
   * Log errors (blocking issues)
   */
  error(message: string, error?: Error, context: LogContext = {}): void {
    const errorDetails = error ? ` - ${error.message}` : '';
    this.log('error', `❌ ${message}${errorDetails}`, {
      ...context,
      stack: error?.stack
    });
  }

  /**
   * Log debug information (only in debug mode)
   */
  debug(message: string, context: LogContext = {}): void {
    if (this.isDebugMode) {
      this.log('debug', `🔍 DEBUG: ${message}`, context);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context: LogContext = {}): void {
    this.log('info', `ℹ️ ${message}`, context);
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context: LogContext = {}): void {
    const formattedDuration = duration > 1000
      ? `${(duration / 1000).toFixed(2)}s`
      : `${duration}ms`;

    this.log('info', `⚡ ${operation} completed in ${formattedDuration}`, {
      ...context,
      duration,
      performance: true
    });
  }

  /**
   * Log retry attempts
   */
  retry(operation: string, attempt: number, maxAttempts: number, error?: Error): void {
    const message = `🔄 Retry ${attempt}/${maxAttempts}: ${operation}`;
    const level = attempt === maxAttempts ? 'error' : 'warn';

    this.log(level, message, {
      operation,
      attempt,
      maxAttempts,
      isLastAttempt: attempt === maxAttempts,
      error: error?.message
    });
  }

  /**
   * Log test summary information
   */
  summary(title: string, items: string[]): void {
    this.log('info', `📊 ${title}:`);
    items.forEach(item => {
      this.log('info', `  ${item}`);
    });
  }

  /**
   * Start a timer for performance tracking
   */
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  /**
   * End a timer and return elapsed time in seconds
   */
  endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      this.warn(`Timer '${label}' was not started`);
      return 0;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    this.timers.delete(label);
    return elapsed;
  }

  /**
   * Log operation with automatic timing (compatibility method)
   */
  timed(label: string, message: string): void {
    const elapsed = this.endTimer(label);
    this.performance(message, elapsed * 1000);
  }

  /**
   * Log a navigation action (compatibility method)
   */
  navigate(destination: string): void {
    this.info(`🧭 Navigate to ${destination}`);
  }

  /**
   * Log a click action (compatibility method)
   */
  click(element: string): void {
    this.debug(`🖱️  Click on: ${element}`);
  }

  /**
   * Log a wait action (compatibility method)
   */
  waiting(element: string, timeout?: number): void {
    const timeoutMsg = timeout ? ` (timeout: ${timeout}ms)` : '';
    this.debug(`⏳ Waiting for: ${element}${timeoutMsg}`);
  }

  /**
   * Create a scoped logger for a specific page
   */
  forPage(pageName: string) {
    return {
      step: (action: string, context: LogContext = {}) =>
        this.step(pageName, action, context),
      success: (message: string, context: LogContext = {}) =>
        this.success(message, { ...context, page: pageName }),
      warn: (message: string, context: LogContext = {}) =>
        this.warn(message, { ...context, page: pageName }),
      error: (message: string, error?: Error, context: LogContext = {}) =>
        this.error(message, error, { ...context, page: pageName }),
      debug: (message: string, context: LogContext = {}) =>
        this.debug(message, { ...context, page: pageName }),
      info: (message: string, context: LogContext = {}) =>
        this.info(message, { ...context, page: pageName }),
      // Compatibility methods
      navigate: (destination: string) => this.navigate(destination),
      click: (element: string) => this.click(element),
      waiting: (element: string, timeout?: number) => this.waiting(element, timeout),
      startTimer: (label: string) => this.startTimer(label),
      endTimer: (label: string) => this.endTimer(label),
      timed: (label: string, message: string) => this.timed(label, message),
    };
  }

  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const timestamp = new Date().toISOString();

    // In CI, be much less verbose with plain text output
    if (this.isCI) {
      // Only log errors, warnings, and final test results in CI
      if (level === 'error' ||
          (level === 'warn' && !message.includes('App page loaded but no content detected')) ||
          (level === 'info' && (
            message.includes('✅ Test passed') ||
            message.includes('❌ Test failed') ||
            message.includes('E2E Test Config:')
          ))) {
        // Use plain text in CI for better readability
        console.log(message);
      }
      // Completely suppress 'step' level in CI
    } else {
      // In local development, use human-readable format
      console.log(message);

      // Log context details in debug mode
      if (this.isDebugMode && Object.keys(context).length > 0) {
        console.log('  Context:', JSON.stringify(context, null, 2));
      }
    }
  }

  private getStepEmoji(action: string): string {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('navigate') || actionLower.includes('goto')) return '🧭';
    if (actionLower.includes('click')) return '👆';
    if (actionLower.includes('type') || actionLower.includes('fill')) return '⌨️';
    if (actionLower.includes('wait') || actionLower.includes('loading')) return '⏳';
    if (actionLower.includes('verify') || actionLower.includes('check')) return '🔍';
    if (actionLower.includes('install') || actionLower.includes('deploy')) return '📦';
    if (actionLower.includes('screenshot')) return '📸';
    if (actionLower.includes('menu') || actionLower.includes('button')) return '🔘';

    return '🔧'; // Default for other actions
  }
}

// Singleton instance export
export const logger = Logger.getInstance();
