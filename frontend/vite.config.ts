import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Remove the unstable regex-based Cairo plugin and use the dedicated Node.js backend.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
