import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Permet l'accès depuis le réseau
    port: 5173,
    https: {
      key: '../backend/ssl/key.pem',
      cert: '../backend/ssl/cert.pem',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Production optimizations
    target: 'esnext',
    minify: 'esbuild', // Faster than terser
    cssMinify: true,
    sourcemap: false, // Disable in production for smaller bundles
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
          ],
          'query-vendor': ['@tanstack/react-query'],
          'mapbox-vendor': ['mapbox-gl', 'react-map-gl/mapbox', '@mapbox/mapbox-gl-geocoder'],
          'chart-vendor': ['recharts'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 10000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-map-gl/mapbox'],
  },
})
