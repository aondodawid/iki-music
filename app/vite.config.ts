import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      filename: "assets/sw.js",
      manifestFilename: "assets/manifest.webmanifest",
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "icons.svg",
        "screenshot-wide.png",
        "screenshot-mobile.png",
      ],
      manifest: {
        id: "/?source=pwa",
        name: "IKI Music Studio",
        short_name: "IKI Music",
        description:
          "AI-assisted music creation app with live jam and chat generation modes.",
        theme_color: "#312e81",
        background_color: "#f8fafc",
        dir: "ltr",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait",
        start_url: "/?source=pwa",
        scope: "/",
        lang: "en",
        prefer_related_applications: false,
        categories: ["music", "entertainment", "productivity"],
        shortcuts: [
          {
            name: "Live Jam",
            short_name: "Jam",
            description: "Open live accompaniment mode",
            url: "/?mode=live-jam",
            icons: [
              {
                src: "/assets/pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
            ],
          },
          {
            name: "Chat Generate",
            short_name: "Chat",
            description: "Open prompt-based generation",
            url: "/?mode=chat-generate",
            icons: [
              {
                src: "/assets/pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
            ],
          },
        ],
        screenshots: [
          {
            src: "/assets/screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            label: "IKI Music Studio dashboard",
            form_factor: "wide",
          },
          {
            src: "/assets/screenshot-mobile.png",
            sizes: "390x844",
            type: "image/png",
            label: "IKI Music Studio mobile view",
            form_factor: "narrow",
          },
        ],
        icons: [
          {
            src: "/assets/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/assets/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/assets/pwa-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === "document" &&
              (url.protocol === "http:" || url.protocol === "https:"),
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "image" ||
              request.destination === "font" ||
              url.pathname.startsWith("/api/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "assets-and-api-cache",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/hf-v2": {
        target: "https://huggingface.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hf-v2/, ""),
      },
      "/hf": {
        target: "https://huggingface.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hf/, ""),
      },
      "/api": {
        target: "https://huggingface.co",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.ts",
    coverage: {
      reporter: ["text"],
    },
  },
});
