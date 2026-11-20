import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
      '/stores': 'http://localhost:5000',
      '/ratings': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
    },
  },
});
