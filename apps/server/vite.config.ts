import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    env: { IS_TEST: 'true' },
    globalSetup: './vitest.global-setup.ts',
    setupFiles: './vitest.setup.ts',
  },
});
