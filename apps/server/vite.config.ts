import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
