import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https?.*/,
            handler: "NetworkFirst",
            options: { cacheName: "bancada-cache", expiration: { maxEntries: 200, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
