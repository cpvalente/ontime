import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    setupFiles: './src/setupTests.js',
    environment: 'jsdom',
  },
});
