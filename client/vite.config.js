import sentryVitePlugin from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

import { ONTIME_VERSION } from '../server/src/version.js';

export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgrPlugin(),
    sentryVitePlugin({
      org: "carlos-valente",
      project: "ontime",
      include: "./build",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: ONTIME_VERSION,
    }),
  ],
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    setupFiles: './src/setupTests.js',
    environment: 'jsdom',
  },
  build: {
    outDir: './build',
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
