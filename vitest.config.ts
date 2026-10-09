import { defineConfig } from 'vitest/config';

/**
 * Runs the unit tests of every package as one, to produce a single coverage report
 * Day to day, tests are run from each package (see `pnpm test`)
 */
export default defineConfig({
  test: {
    projects: ['apps/server', 'apps/client', 'packages/utils'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      // the client coverage is limited to ts files, tsx components are not unit tested
      include: ['apps/server/src/**/*.ts', 'apps/client/src/**/*.ts', 'packages/utils/src/**/*.ts'],
      exclude: [
        '**/*.tsx',
        '**/*.test.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/*.d.ts',
        // placeholders
        'apps/server/src/middleware/noop.ts',
        'apps/server/src/adapters/IAdapter.ts',
      ],
    },
  },
});
