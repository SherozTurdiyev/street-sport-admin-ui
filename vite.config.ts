import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// `defineConfig` ATAYLAB `vitest/config` dan: `vite` dan olingani
// `test` kalitini bilmaydi va TypeScript xato beradi.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Port ATAYLAB qotirilgan. Backend `CORS_ORIGINS` da aynan 5173 bor;
    // Vite boshqa portga o'tsa cookie yuborilmaydi va login jimgina
    // ishlamay qoladi — sababini topish qiyin bo'lgan xato.
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
