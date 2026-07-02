import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Em dev local, use `vercel dev` para as funções /api funcionarem.
      // Este proxy é só um fallback caso rode `vite dev` puro.
    }
  }
});
