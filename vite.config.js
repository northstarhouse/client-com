import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'North Star House - Bookings Log',
        short_name: 'Bookings Log',
        start_url: './',
        display: 'standalone',
        background_color: '#f7f5f2',
        theme_color: '#1c1917',
        icons: [
          {
            src: './vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: './vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff,woff2}'],
        cleanupOutdatedCaches: false,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pages',
            },
          },
          {
            urlPattern: ({ request }) =>
              ['script', 'style', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets',
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
