import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expose to LAN
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5001', // Updated to match backend port
      '/uploads': 'http://localhost:5001' // Updated to match backend port
    }
  }
});
