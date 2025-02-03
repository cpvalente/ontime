// vite.config.js
import { sentryVitePlugin } from "file:///home/shbhtngpl/personal/oss/ontime/node_modules/.pnpm/@sentry+vite-plugin@2.16.1/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import react from "file:///home/shbhtngpl/personal/oss/ontime/node_modules/.pnpm/@vitejs+plugin-react@4.2.1_vite@5.2.11_@types+node@20.14.10_sass@1.57.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///home/shbhtngpl/personal/oss/ontime/node_modules/.pnpm/vite@5.2.11_@types+node@20.14.10_sass@1.57.1/node_modules/vite/dist/node/index.js";
import { compression } from "file:///home/shbhtngpl/personal/oss/ontime/node_modules/.pnpm/vite-plugin-compression2@1.3.3_rollup@4.17.2_vite@5.2.11_@types+node@20.14.10_sass@1.57.1_/node_modules/vite-plugin-compression2/dist/index.mjs";
import svgrPlugin from "file:///home/shbhtngpl/personal/oss/ontime/node_modules/.pnpm/vite-plugin-svgr@4.2.0_rollup@4.17.2_typescript@5.5.3_vite@5.2.11_@types+node@20.14.10_sass@1.57.1_/node_modules/vite-plugin-svgr/dist/index.js";

// src/ONTIME_VERSION.js
var ONTIME_VERSION = "3.10.3";

// vite.config.js
var __vite_injected_original_import_meta_url = "file:///home/shbhtngpl/personal/oss/ontime/apps/client/vite.config.js";
var sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
var isDev = process.env.NODE_ENV === "local" || process.env.NODE_ENV === "development";
var vite_config_default = defineConfig({
  base: "./",
  // Ontime cloud: we use relative paths to allow them to reference a dynamic base set at runtime
  plugins: [
    react(),
    svgrPlugin(),
    !isDev && sentryVitePlugin({
      org: "get-ontime",
      project: "ontime",
      include: "./build",
      authToken: sentryAuthToken,
      release: ONTIME_VERSION,
      deploy: {
        env: "production"
      },
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
        excludeReplayWorker: true
      }
    }),
    compression({
      algorithm: "brotliCompress",
      exclude: /\.(html)$/
      // Ontime cloud: Exclude HTML files from compression so we can change the base property at runtime
    })
  ],
  server: {
    port: 3e3
  },
  test: {
    globals: true,
    environment: "jsdom"
  },
  build: {
    outDir: "./build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  esbuild: {
    legalComments: "none"
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use './src/theme/ontimeColours' as *;
        @use './src/theme/ontimeStyles' as *;
        @use './src/theme/mixins' as *;
        `
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic3JjL09OVElNRV9WRVJTSU9OLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvc2hiaHRuZ3BsL3BlcnNvbmFsL29zcy9vbnRpbWUvYXBwcy9jbGllbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3NoYmh0bmdwbC9wZXJzb25hbC9vc3Mvb250aW1lL2FwcHMvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3NoYmh0bmdwbC9wZXJzb25hbC9vc3Mvb250aW1lL2FwcHMvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gJ0BzZW50cnkvdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHsgY29tcHJlc3Npb24gfSBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbjInO1xuaW1wb3J0IHN2Z3JQbHVnaW4gZnJvbSAndml0ZS1wbHVnaW4tc3Zncic7XG5cbmltcG9ydCB7IE9OVElNRV9WRVJTSU9OIH0gZnJvbSAnLi9zcmMvT05USU1FX1ZFUlNJT04nO1xuXG5jb25zdCBzZW50cnlBdXRoVG9rZW4gPSBwcm9jZXNzLmVudi5TRU5UUllfQVVUSF9UT0tFTjtcbmNvbnN0IGlzRGV2ID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdsb2NhbCcgfHwgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6ICcuLycsIC8vIE9udGltZSBjbG91ZDogd2UgdXNlIHJlbGF0aXZlIHBhdGhzIHRvIGFsbG93IHRoZW0gdG8gcmVmZXJlbmNlIGEgZHluYW1pYyBiYXNlIHNldCBhdCBydW50aW1lXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHN2Z3JQbHVnaW4oKSxcbiAgICAhaXNEZXYgJiZcbiAgICAgIHNlbnRyeVZpdGVQbHVnaW4oe1xuICAgICAgICBvcmc6ICdnZXQtb250aW1lJyxcbiAgICAgICAgcHJvamVjdDogJ29udGltZScsXG4gICAgICAgIGluY2x1ZGU6ICcuL2J1aWxkJyxcbiAgICAgICAgYXV0aFRva2VuOiBzZW50cnlBdXRoVG9rZW4sXG4gICAgICAgIHJlbGVhc2U6IE9OVElNRV9WRVJTSU9OLFxuICAgICAgICBkZXBsb3k6IHtcbiAgICAgICAgICBlbnY6ICdwcm9kdWN0aW9uJyxcbiAgICAgICAgfSxcbiAgICAgICAgYnVuZGxlU2l6ZU9wdGltaXphdGlvbnM6IHtcbiAgICAgICAgICBleGNsdWRlRGVidWdTdGF0ZW1lbnRzOiB0cnVlLFxuICAgICAgICAgIGV4Y2x1ZGVSZXBsYXlJZnJhbWU6IHRydWUsXG4gICAgICAgICAgZXhjbHVkZVJlcGxheVNoYWRvd0RvbTogdHJ1ZSxcbiAgICAgICAgICBleGNsdWRlUmVwbGF5V29ya2VyOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgY29tcHJlc3Npb24oe1xuICAgICAgYWxnb3JpdGhtOiAnYnJvdGxpQ29tcHJlc3MnLFxuICAgICAgZXhjbHVkZTogL1xcLihodG1sKSQvLCAvLyBPbnRpbWUgY2xvdWQ6IEV4Y2x1ZGUgSFRNTCBmaWxlcyBmcm9tIGNvbXByZXNzaW9uIHNvIHdlIGNhbiBjaGFuZ2UgdGhlIGJhc2UgcHJvcGVydHkgYXQgcnVudGltZVxuICAgIH0pLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICB9LFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICcuL2J1aWxkJyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgIC8vIFNwbGl0IHZlbmRvciBjb2RlXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuICBlc2J1aWxkOiB7XG4gICAgbGVnYWxDb21tZW50czogJ25vbmUnLFxuICB9LFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBzY3NzOiB7XG4gICAgICAgIGFkZGl0aW9uYWxEYXRhOiBgXG4gICAgICAgIEB1c2UgJy4vc3JjL3RoZW1lL29udGltZUNvbG91cnMnIGFzICo7XG4gICAgICAgIEB1c2UgJy4vc3JjL3RoZW1lL29udGltZVN0eWxlcycgYXMgKjtcbiAgICAgICAgQHVzZSAnLi9zcmMvdGhlbWUvbWl4aW5zJyBhcyAqO1xuICAgICAgICBgLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3NoYmh0bmdwbC9wZXJzb25hbC9vc3Mvb250aW1lL2FwcHMvY2xpZW50L3NyY1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvc2hiaHRuZ3BsL3BlcnNvbmFsL29zcy9vbnRpbWUvYXBwcy9jbGllbnQvc3JjL09OVElNRV9WRVJTSU9OLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3NoYmh0bmdwbC9wZXJzb25hbC9vc3Mvb250aW1lL2FwcHMvY2xpZW50L3NyYy9PTlRJTUVfVkVSU0lPTi5qc1wiO2V4cG9ydCBjb25zdCBPTlRJTUVfVkVSU0lPTiA9IFwiMy4xMC4zXCI7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStULFNBQVMsd0JBQXdCO0FBQ2hXLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWUsV0FBVztBQUNuQyxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLG1CQUFtQjtBQUM1QixPQUFPLGdCQUFnQjs7O0FDTGlVLElBQU0saUJBQWlCOzs7QURBekssSUFBTSwyQ0FBMkM7QUFTdlAsSUFBTSxrQkFBa0IsUUFBUSxJQUFJO0FBQ3BDLElBQU0sUUFBUSxRQUFRLElBQUksYUFBYSxXQUFXLFFBQVEsSUFBSSxhQUFhO0FBRTNFLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sV0FBVztBQUFBLElBQ1gsQ0FBQyxTQUNDLGlCQUFpQjtBQUFBLE1BQ2YsS0FBSztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLE1BQ1QsV0FBVztBQUFBLE1BQ1gsU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLFFBQ04sS0FBSztBQUFBLE1BQ1A7QUFBQSxNQUNBLHlCQUF5QjtBQUFBLFFBQ3ZCLHdCQUF3QjtBQUFBLFFBQ3hCLHFCQUFxQjtBQUFBLFFBQ3JCLHdCQUF3QjtBQUFBLFFBQ3hCLHFCQUFxQjtBQUFBLE1BQ3ZCO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDSCxZQUFZO0FBQUEsTUFDVixXQUFXO0FBQUEsTUFDWCxTQUFTO0FBQUE7QUFBQSxJQUNYLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGFBQWEsSUFBSTtBQUVmLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsZUFBZTtBQUFBLEVBQ2pCO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxxQkFBcUI7QUFBQSxNQUNuQixNQUFNO0FBQUEsUUFDSixnQkFBZ0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BS2xCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
