import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the API (server/) runs on :4010 and Vite proxies to it.
// In production the same Node server serves the built site AND the API.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    proxy: {
      // keep the original Host header: the API compares it with the Origin header (CSRF protection)
      '/api': { target: 'http://127.0.0.1:4010', changeOrigin: false },
      '/media': { target: 'http://127.0.0.1:4010', changeOrigin: false },
    },
  },
})
