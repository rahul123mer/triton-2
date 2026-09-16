import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { restaurantSettingsPlugin } from './vite.restaurantSettings.js'

export default defineConfig({
  plugins: [react(), restaurantSettingsPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false },
    },
  },
})
