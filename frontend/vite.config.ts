import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { resolve } from 'path'

// Load environment variables explicitly
const env = loadEnv('development', process.cwd(), 'VITE_')

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('VITE_HOST:', env.VITE_HOST);
console.log('VITE_PORT:', env.VITE_PORT);
console.log('VITE_API_URL:', env.VITE_API_URL);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  server: {
    host: env.VITE_HOST || 'localhost',
    port: parseInt(env.VITE_PORT || '3000'),
    strictPort: false, // Don't fail if the port is occupied
    proxy: {
      '/api': {
        target: env.VITE_API_URL || 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false, // Set to true if using HTTPS for the target
        // Log proxy activity for debugging
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`Proxying request: ${req.method} ${req.url} -> ${options.target}${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`Proxying response: ${proxyRes.statusCode} ${req.url}`);
          });
        }
      }
    }
  }
})