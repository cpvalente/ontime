import { sentryVitePlugin } from '@sentry/vite-plugin';
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';
import svgrPlugin from 'vite-plugin-svgr';

import { ONTIME_VERSION } from './src/ONTIME_VERSION';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const isDev = process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development';

export default defineConfig({
  base: './', // Ontime cloud: we use relative paths to allow them to reference a dynamic base set at runtime
  plugins: [
    react(),
    svgrPlugin(),
    !isDev &&
      sentryVitePlugin({
        org: 'get-ontime',
        project: 'ontime',
        include: './build',
        authToken: sentryAuthToken,
        release: ONTIME_VERSION,
        deploy: {
          env: 'production',
        },
        bundleSizeOptimizations: {
          excludeDebugStatements: true,
          excludeReplayIframe: true,
          excludeReplayShadowDom: true,
          excludeReplayWorker: true,
        },
      }),
    legacy({ targets: ['chrome >= 89'] }),
    compression({
      algorithm: 'brotliCompress',
      exclude: /\.(html)$/, // Ontime cloud: Exclude HTML files from compression so we can change the base property at runtime
    }),
  ],
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    outDir: './build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor code
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  esbuild: {
    legalComments: 'none',
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use './src/theme/ontimeColours' as *;
        @use './src/theme/ontimeStyles' as *;
        @use './src/theme/mixins' as *;
        `,
      },
    },
  },
});
