import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Lightweight production build: manual chunking keeps vendor code cacheable
// separately from app code, and each route is already code-split via
// React.lazy() in src/App.jsx.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2018',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
