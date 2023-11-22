import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';
import svgrPlugin from 'vite-plugin-svgr';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import legacy from '@vitejs/plugin-legacy';
import { ONTIME_VERSION } from './src/ONTIME_VERSION';
import postcssPresetEnv from 'postcss-preset-env';

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
    legacy({
      targets: ['>0.2%', 'not dead', 'not op_mini all', 'Chrome >= 71'],
      modernPolyfills: ['es/object'],
    }),
    compression({ algorithm: 'brotliCompress' }),
  ],
  css: {
    postcss: {
      plugins: [
        postcssPresetEnv({
          browsers: ['>0.2%', 'not dead', 'not op_mini all', 'Chrome >= 71'],
        }),
      ],
    },
  },
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
