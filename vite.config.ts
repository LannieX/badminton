import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  server: { proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true } } },
  plugins: [react(), tailwindcss()],
});
