import { defineConfig, devices } from '@playwright/test';
import type { SmartLogOptions } from './src/smart-log';

/**
 * CI-specific Playwright configuration
 * Optimized for speed and reliability in CI environments
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: true,

  /* Retry on CI for stability */
  retries: 2,

  /* Use fewer workers in CI for stability */
  workers: 1,

  /* Timeout settings for CI */
  timeout: 30000,
  expect: { timeout: 5000 },

  /* Reporter optimized for CI */
  reporter: [
    ['github'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['list'],
  ],

  /* Shared settings for CI */
  use: {
    /* CI-optimized smart logger settings */
    smartLog: {
      flushOn: ['fail'],
      maxBufferSize: 500,
      capturePageConsole: false,
    } as SmartLogOptions,

    /* Faster settings for CI */
    actionTimeout: 10000,
    navigationTimeout: 30000,

    /* Collect trace only on first retry for CI efficiency */
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for CI */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Run WebKit only on macOS for CI efficiency
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: process.env.RUNNER_OS === 'macOS' ? undefined : /$.^/, // Only on macOS
    },
  ],

  /* Global setup for CI */
  globalSetup: undefined,
  globalTeardown: undefined,
});
