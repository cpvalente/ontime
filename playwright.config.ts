import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const isDevMode = process.env.NODE_ENV === 'development';

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
  webServer: isDevMode
    ? {
        command: 'turbo run dev',
        port: 3000,
        reuseExistingServer: true,
        timeout: 60 * 1000,
      }
    : {
        command: 'turbo run dev --filter=ontime-server',
        port: 4001,
        reuseExistingServer: true,
        timeout: 60 * 1000,
      },
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 5000,
    baseURL: isDevMode ? 'http://localhost:3000' : 'http://localhost:4001',
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
