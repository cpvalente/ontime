import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './apps/client/vite.config.js',
  './apps/server/vite.config.ts',
  './packages/utils/vite.config.ts',
]);
