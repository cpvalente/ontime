import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './e2e/tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  webServer: {
    command: 'npx tsx ./src/index.ts', // More direct command
    cwd: './apps/server', // Set working directory
    port: 4001,
    // url: 'http://localhost:4001/editor', // Removed URL, rely on port check
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'development', // tsx might need this
      IS_TEST: 'true',
    }
  },
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 5000,
    baseURL: 'http://localhost:4001',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: process.env.CI ? undefined : 250,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'webkit',
      testMatch: /.*.spec.mac.ts/,
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
  outputDir: 'test-results/',
};

export default config;
