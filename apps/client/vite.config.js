import sentryVitePlugin from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

import { ONTIME_VERSION } from '../electron/version.js';

export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgrPlugin(),
    sentryVitePlugin({
      org: 'carlos-valente',
      project: 'ontime',
      include: './build',
      authToken: '087754a37bb947f2ab738dfa731267ffec52a9f3a14a42f48061e343d0332c2f',
      release: ONTIME_VERSION,
      deploy: {
        env: 'production',
      },
    }),
  ],
  server: {
    port: 3000,
  },
  test: {
    setupFiles: './src/setupTests.js',
    environment: 'jsdom',
  },
  build: {
    outDir: './build',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
