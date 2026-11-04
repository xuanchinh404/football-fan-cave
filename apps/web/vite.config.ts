import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const backend = process.env.FFC_TEST_BACKEND || (process.env.FFC_TEST ? 'http://127.0.0.1:3101' : 'http://127.0.0.1:3001');
export default defineConfig({
  plugins: [react()],
  cacheDir: process.env.FFC_TEST === 'auth' ? 'node_modules/.vite-auth-test' : process.env.FFC_TEST ? 'node_modules/.vite-grand-test' : 'node_modules/.vite',
  resolve: { dedupe: ['react', 'react-dom', 'three'] },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: backend, ws: true },
      '/api': backend,
    },
  },
  preview: { proxy: { '/socket.io': { target: backend, ws: true }, '/api': backend } },
  build: {
    outDir: process.env.FFC_TEST ? 'dist-grand-test' : 'dist',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber'],
          physics: ['@react-three/rapier'],
          react: ['react', 'react-dom'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
});
