import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';
import svgrPlugin from 'vite-plugin-svgr';

import { ONTIME_VERSION } from './src/ONTIME_VERSION';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const isDev = process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development';

const ReactCompilerConfig = {
  runtimeModule: '@/mycache',
  target: '18',
};

export default defineConfig({
  base: './', // Ontime cloud: we use relative paths to allow them to reference a dynamic base set at runtime
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
      },
    }),
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
    compression({
      algorithm: 'brotliCompress',
      exclude: /\.(html)$/, // Ontime cloud: Exclude HTML files from compression so we can change the base property at runtime
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '^/login*': {
        target: 'http://localhost:4001/',
        changeOrigin: true,
        configure: logProxyRequests,
      },
      '^/data*': {
        target: 'http://localhost:4001/',
        changeOrigin: true,
        configure: logProxyRequests,
      },
      '^/api*': {
        target: 'http://localhost:4001/',
        changeOrigin: true,
        configure: logProxyRequests,
      },
      '^/ws*': {
        target: 'http://localhost:4001/',
        changeOrigin: true,
        configure: logProxyRequests,
        ws: true,
      },
      '^/user*': {
        target: 'http://localhost:4001/',
        changeOrigin: true,
        configure: logProxyRequests,
        ws: true,
      },
    },
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
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    legalComments: 'none',
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use '@/theme/ontimeColours' as *;
        @use '@/theme/ontimeStyles' as *;
        @use '@/theme/mixins' as *;
        `,
      },
    },
  },
});

function logProxyRequests(proxy) {
  proxy.on('proxyReq', (_proxyReq, req, _res) => {
    console.log('Proxy:', req.method, req.url);
  });
}
