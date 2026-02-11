import { defineConfig, devices } from '@playwright/test';
import type { SmartLogOptions } from './src/smart-log';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry always for test reliability */
  retries: 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: './playwright-report' }], ['list']],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Smart Logger Configuration */
    smartLog: {
      flushOn: ['fail', 'retry'],
      maxBufferSize: 1000,
      capturePageConsole: false,
    } as SmartLogOptions,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/.*attach-to-report\.spec\.ts/, /.*flush-on\.spec\.ts/],
    },

    // Project for testing flush-on-pass behavior
    {
      name: 'chromium-flush-pass',
      use: {
        ...devices['Desktop Chrome'],
        smartLog: {
          flushOn: ['pass', 'fail', 'skip'],
          maxBufferSize: 1000,
          capturePageConsole: false,
        } as SmartLogOptions,
      },
      testMatch: /.*flush-on\.spec\.ts/,
    },

    // Project for testing attachToReport behavior
    {
      name: 'chromium-attach-report',
      use: {
        ...devices['Desktop Chrome'],
        smartLog: {
          flushOn: ['fail', 'retry'],
          maxBufferSize: 1000,
          capturePageConsole: false,
          attachToReport: true,
        } as SmartLogOptions,
      },
      testMatch: /.*attach-to-report\.spec\.ts/,
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: [/.*attach-to-report\.spec\.ts/, /.*flush-on\.spec\.ts/],
    },
  ],
});
