import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 5000,
    baseURL: 'http://localhost:4001',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'firefox',
      testMatch: /.*.spec.all.ts/,
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      testMatch: /.*.spec.ts/,
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],

  outputDir: 'test-results/',
};

export default config;
