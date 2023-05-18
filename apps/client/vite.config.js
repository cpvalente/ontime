import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';
import svgrPlugin from 'vite-plugin-svgr';

import { ONTIME_VERSION } from './src/ONTIME_VERSION';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const isLocal = process.env.NODE_ENV === 'local';

export default defineConfig({
  plugins: [
    react(),
    svgrPlugin(),
    !isLocal &&
      sentryVitePlugin({
        org: 'get-ontime',
        project: 'ontime',
        include: './build',
        authToken: sentryAuthToken,
        release: ONTIME_VERSION,
        deploy: {
          env: 'production',
        },
      }),
    compression({ algorithm: 'brotliCompress' }),
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
