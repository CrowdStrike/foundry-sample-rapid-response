/**
 * Centralized configuration management for Foundry E2E tests
 * Provides environment-aware configuration with CI optimizations
 */
export class TestConfig {
  private static _instance: TestConfig;

  // Core URLs and endpoints
  public readonly baseUrl: string;
  public readonly apiBaseUrl: string;

  // Authentication
  public readonly username: string;
  public readonly password: string;
  public readonly authSecret: string;

  // App configuration
  public readonly appName: string;

  // Test configuration
  public readonly defaultTimeout: number;
  public readonly navigationTimeout: number;
  public readonly actionTimeout: number;
  public readonly retryAttempts: number;
  public readonly screenshotPath: string;

  // Environment detection
  public readonly isCI: boolean;
  public readonly isDebugMode: boolean;

  private constructor() {
    // Environment detection (must come first)
    this.isCI = !!process.env.CI;
    this.isDebugMode = process.env.DEBUG === 'true';

    // Validate all required environment variables
    this.validateEnvironment();

    // Core URLs
    this.baseUrl = process.env.FALCON_BASE_URL || 'https://falcon.us-2.crowdstrike.com';
    this.apiBaseUrl = `${this.baseUrl}/api/v2`;

    // Authentication (required)
    this.username = this.getRequiredEnv('FALCON_USERNAME');
    this.password = this.getRequiredEnv('FALCON_PASSWORD');
    this.authSecret = this.getRequiredEnv('FALCON_AUTH_SECRET');

    // App configuration
    this.appName = this.getRequiredEnv('APP_NAME');

    // Test timeouts (CI-aware defaults - longer in CI due to slower hardware)
    this.defaultTimeout = parseInt(
      process.env.DEFAULT_TIMEOUT || (this.isCI ? '45000' : '30000')
    );
    this.navigationTimeout = parseInt(
      process.env.NAVIGATION_TIMEOUT || (this.isCI ? '30000' : '15000')
    );
    this.actionTimeout = this.isCI ? 15000 : 10000;
    this.retryAttempts = parseInt(
      process.env.RETRY_ATTEMPTS || (this.isCI ? '3' : '2')
    );

    // Paths
    this.screenshotPath = process.env.SCREENSHOT_PATH || 'test-results';
  }

  public static getInstance(): TestConfig {
    if (!TestConfig._instance) {
      TestConfig._instance = new TestConfig();
    }
    return TestConfig._instance;
  }

  private validateEnvironment(): void {
    const required = [
      'FALCON_USERNAME',
      'FALCON_PASSWORD',
      'FALCON_AUTH_SECRET',
      'APP_NAME'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `❌ Missing required environment variables: ${missing.join(', ')}\n` +
        `Please check your .env file or environment setup.`
      );
    }
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`❌ Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get environment-aware configuration for Playwright timeouts
   */
  public getPlaywrightTimeouts() {
    return {
      timeout: this.defaultTimeout,
      navigationTimeout: this.navigationTimeout,
      actionTimeout: this.actionTimeout,
    };
  }

  /**
   * Get retry configuration for flaky operations
   */
  public getRetryConfig() {
    return {
      attempts: this.retryAttempts,
      delay: this.isCI ? 2000 : 1000,
    };
  }

  /**
   * Print configuration summary (safe for logs)
   */
  public printSummary(): void {
    if (this.isCI) {
      // Minimal logging in CI
      console.log(`\nE2E Test Config: CI | ${this.appName}\n`);
    } else {
      // Detailed logging for local development
      console.log('\n🔧 Test Configuration:');
      console.log(`  Environment: ${this.isCI ? 'CI' : 'Local'}`);
      console.log(`  Base URL: ${this.baseUrl}`);
      console.log(`  App Name: ${this.appName}`);
      console.log(`  Default Timeout: ${this.defaultTimeout}ms`);
      console.log(`  Retry Attempts: ${this.retryAttempts}`);
      console.log(`  Debug Mode: ${this.isDebugMode ? 'enabled' : 'disabled'}\n`);
    }
  }
}

// Singleton instance export
export const config = TestConfig.getInstance();
