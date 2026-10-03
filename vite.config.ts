import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
  build: { target: 'es2022', rollupOptions: { output: { manualChunks: { spectacle: ['spectacle'], motion: ['framer-motion'] } } } },
});
