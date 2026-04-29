// vite.config.js
import { sentryVitePlugin } from "file:///Users/alanaiken/Documents/GitHub/ontime/node_modules/.pnpm/@sentry+vite-plugin@2.16.1/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import react from "file:///Users/alanaiken/Documents/GitHub/ontime/node_modules/.pnpm/@vitejs+plugin-react@4.2.1_vite@5.2.11_@types+node@22.10.10_sass@1.57.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///Users/alanaiken/Documents/GitHub/ontime/node_modules/.pnpm/vite@5.2.11_@types+node@22.10.10_sass@1.57.1/node_modules/vite/dist/node/index.js";
import { compression } from "file:///Users/alanaiken/Documents/GitHub/ontime/node_modules/.pnpm/vite-plugin-compression2@1.3.3_rollup@4.17.2_vite@5.2.11_@types+node@22.10.10_sass@1.57.1_/node_modules/vite-plugin-compression2/dist/index.mjs";
import svgrPlugin from "file:///Users/alanaiken/Documents/GitHub/ontime/node_modules/.pnpm/vite-plugin-svgr@4.2.0_rollup@4.17.2_typescript@5.5.3_vite@5.2.11_@types+node@22.10.10_sass@1.57.1_/node_modules/vite-plugin-svgr/dist/index.js";

// src/ONTIME_VERSION.js
var ONTIME_VERSION = "3.18.0";

// vite.config.js
var __vite_injected_original_import_meta_url = "file:///Users/alanaiken/Documents/GitHub/ontime/apps/client/vite.config.js";
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
    host: true,
    port: 5173
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic3JjL09OVElNRV9WRVJTSU9OLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2FsYW5haWtlbi9Eb2N1bWVudHMvR2l0SHViL29udGltZS9hcHBzL2NsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2FsYW5haWtlbi9Eb2N1bWVudHMvR2l0SHViL29udGltZS9hcHBzL2NsaWVudC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWxhbmFpa2VuL0RvY3VtZW50cy9HaXRIdWIvb250aW1lL2FwcHMvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gJ0BzZW50cnkvdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHsgY29tcHJlc3Npb24gfSBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbjInO1xuaW1wb3J0IHN2Z3JQbHVnaW4gZnJvbSAndml0ZS1wbHVnaW4tc3Zncic7XG5cbmltcG9ydCB7IE9OVElNRV9WRVJTSU9OIH0gZnJvbSAnLi9zcmMvT05USU1FX1ZFUlNJT04nO1xuXG5jb25zdCBzZW50cnlBdXRoVG9rZW4gPSBwcm9jZXNzLmVudi5TRU5UUllfQVVUSF9UT0tFTjtcbmNvbnN0IGlzRGV2ID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdsb2NhbCcgfHwgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6ICcuLycsIC8vIE9udGltZSBjbG91ZDogd2UgdXNlIHJlbGF0aXZlIHBhdGhzIHRvIGFsbG93IHRoZW0gdG8gcmVmZXJlbmNlIGEgZHluYW1pYyBiYXNlIHNldCBhdCBydW50aW1lXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHN2Z3JQbHVnaW4oKSxcbiAgICAhaXNEZXYgJiZcbiAgICAgIHNlbnRyeVZpdGVQbHVnaW4oe1xuICAgICAgICBvcmc6ICdnZXQtb250aW1lJyxcbiAgICAgICAgcHJvamVjdDogJ29udGltZScsXG4gICAgICAgIGluY2x1ZGU6ICcuL2J1aWxkJyxcbiAgICAgICAgYXV0aFRva2VuOiBzZW50cnlBdXRoVG9rZW4sXG4gICAgICAgIHJlbGVhc2U6IE9OVElNRV9WRVJTSU9OLFxuICAgICAgICBkZXBsb3k6IHtcbiAgICAgICAgICBlbnY6ICdwcm9kdWN0aW9uJyxcbiAgICAgICAgfSxcbiAgICAgICAgYnVuZGxlU2l6ZU9wdGltaXphdGlvbnM6IHtcbiAgICAgICAgICBleGNsdWRlRGVidWdTdGF0ZW1lbnRzOiB0cnVlLFxuICAgICAgICAgIGV4Y2x1ZGVSZXBsYXlJZnJhbWU6IHRydWUsXG4gICAgICAgICAgZXhjbHVkZVJlcGxheVNoYWRvd0RvbTogdHJ1ZSxcbiAgICAgICAgICBleGNsdWRlUmVwbGF5V29ya2VyOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgY29tcHJlc3Npb24oe1xuICAgICAgYWxnb3JpdGhtOiAnYnJvdGxpQ29tcHJlc3MnLFxuICAgICAgZXhjbHVkZTogL1xcLihodG1sKSQvLCAvLyBPbnRpbWUgY2xvdWQ6IEV4Y2x1ZGUgSFRNTCBmaWxlcyBmcm9tIGNvbXByZXNzaW9uIHNvIHdlIGNhbiBjaGFuZ2UgdGhlIGJhc2UgcHJvcGVydHkgYXQgcnVudGltZVxuICAgIH0pLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHBvcnQ6IDUxNzMsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJy4vYnVpbGQnLFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgLy8gU3BsaXQgdmVuZG9yIGNvZGVcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgIH0sXG4gIH0sXG4gIGVzYnVpbGQ6IHtcbiAgICBsZWdhbENvbW1lbnRzOiAnbm9uZScsXG4gIH0sXG4gIGNzczoge1xuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgYWRkaXRpb25hbERhdGE6IGBcbiAgICAgICAgQHVzZSAnLi9zcmMvdGhlbWUvb250aW1lQ29sb3VycycgYXMgKjtcbiAgICAgICAgQHVzZSAnLi9zcmMvdGhlbWUvb250aW1lU3R5bGVzJyBhcyAqO1xuICAgICAgICBAdXNlICcuL3NyYy90aGVtZS9taXhpbnMnIGFzICo7XG4gICAgICAgIGAsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2FsYW5haWtlbi9Eb2N1bWVudHMvR2l0SHViL29udGltZS9hcHBzL2NsaWVudC9zcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hbGFuYWlrZW4vRG9jdW1lbnRzL0dpdEh1Yi9vbnRpbWUvYXBwcy9jbGllbnQvc3JjL09OVElNRV9WRVJTSU9OLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9hbGFuYWlrZW4vRG9jdW1lbnRzL0dpdEh1Yi9vbnRpbWUvYXBwcy9jbGllbnQvc3JjL09OVElNRV9WRVJTSU9OLmpzXCI7ZXhwb3J0IGNvbnN0IE9OVElNRV9WRVJTSU9OID0gXCIzLjE4LjBcIjtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFUsU0FBUyx3QkFBd0I7QUFDL1csT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZSxXQUFXO0FBQ25DLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsbUJBQW1CO0FBQzVCLE9BQU8sZ0JBQWdCOzs7QUNMZ1YsSUFBTSxpQkFBaUI7OztBREE5SyxJQUFNLDJDQUEyQztBQVNqUSxJQUFNLGtCQUFrQixRQUFRLElBQUk7QUFDcEMsSUFBTSxRQUFRLFFBQVEsSUFBSSxhQUFhLFdBQVcsUUFBUSxJQUFJLGFBQWE7QUFFM0UsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsSUFDWCxDQUFDLFNBQ0MsaUJBQWlCO0FBQUEsTUFDZixLQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxTQUFTO0FBQUEsTUFDVCxXQUFXO0FBQUEsTUFDWCxTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsUUFDTixLQUFLO0FBQUEsTUFDUDtBQUFBLE1BQ0EseUJBQXlCO0FBQUEsUUFDdkIsd0JBQXdCO0FBQUEsUUFDeEIscUJBQXFCO0FBQUEsUUFDckIsd0JBQXdCO0FBQUEsUUFDeEIscUJBQXFCO0FBQUEsTUFDdkI7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNILFlBQVk7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLFNBQVM7QUFBQTtBQUFBLElBQ1gsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sYUFBYSxJQUFJO0FBRWYsY0FBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxlQUFlO0FBQUEsRUFDakI7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILHFCQUFxQjtBQUFBLE1BQ25CLE1BQU07QUFBQSxRQUNKLGdCQUFnQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
