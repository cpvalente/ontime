import { join } from 'node:path';

import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const isDevMode = process.env.NODE_ENV === 'development';

const server: PlaywrightTestConfig['webServer'] = {
  name: 'SERVER',
  command: 'pnpm --filter ontime-server dev',
  url: 'http://localhost:4001/health',
  reuseExistingServer: !process.env.CI,
  timeout: 60 * 1000,
  wait: {
    stdout: /Local: http:\/\/localhost:4001\/editor\n/,
  },
  env: {
    PORT: '4001',
    ONTIME_DATA: join(import.meta.dirname, 'e2e/tests/fixtures/tmp/main-server'),
  },
};

const uiDevServer: PlaywrightTestConfig['webServer'] = isDevMode
  ? [
      {
        name: 'UI',
        command: 'pnpm --filter ontime-ui dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 60 * 1000,
        wait: {
          stdout: /Local:   http:\/\/localhost:3000\/\n/,
        },
      },
    ]
  : [];

/**
 * A second server protected with a password, used by the password spec
 * it has its own port and data folder so it does not share state with the main server
 * it serves the built client, which the dev mode flow does not otherwise build
 */
const passwordServer: PlaywrightTestConfig['webServer'] = {
  name: 'PASSWORD-SERVER',
  command: 'pnpm --filter ontime-server dev',
  url: 'http://localhost:4002/health',
  reuseExistingServer: false,
  timeout: 60 * 1000,
  wait: {
    stdout: /Local: http:\/\/localhost:4002\/editor\n/,
  },
  env: {
    PORT: '4002',
    SESSION_PASSWORD: 'e2e-password',
    ONTIME_DATA: join(import.meta.dirname, 'e2e/tests/fixtures/tmp/password-server'),
  },
};

/**
 * A server which mirrors an Ontime Cloud deployment, used by the prefixed project
 * the client is served below a router prefix, ie: http://localhost:4003/client-hash/timer
 * specs navigate with relative paths so they resolve below either base URL
 */
const cloudPrefix = 'client-hash';
const cloudServer: PlaywrightTestConfig['webServer'] = {
  name: 'CLOUD-SERVER',
  command: 'node e2e/cloud-server.mjs',
  url: `http://localhost:4003/${cloudPrefix}/health`,
  reuseExistingServer: false,
  timeout: 120 * 1000,
  wait: {
    stdout: new RegExp(`Local: http://localhost:4003/${cloudPrefix}/editor\n`),
  },
  env: {
    PORT: '4003',
    ROUTER_PREFIX: cloudPrefix,
  },
};

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
  webServer: [server, passwordServer, cloudServer, ...uiDevServer],
  use: {
    screenshot: process.env.CI ? 'off' : 'only-on-failure',
    video: process.env.CI ? 'off' : 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 5000,
    baseURL: isDevMode ? 'http://localhost:3000/' : 'http://localhost:4001/',
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
      name: 'chromium-prefixed',
      // the password spec targets its own server
      testIgnore: '**/216-password.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:4003/${cloudPrefix}/`,
      },
    },
  ],
  outputDir: 'test-results/',
};

export default config;
