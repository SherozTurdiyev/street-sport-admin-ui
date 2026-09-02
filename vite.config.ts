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
  build: {
    // Bitta ulkan bo'lak o'rniga uchta: antd, React va ilova kodi.
    // Ilova kodi tez-tez o'zgaradi, kutubxonalar esa deyarli hech
    // qachon — ularni ajratish takroriy tashriflarda brauzer keshini
    // ishlatishga imkon beradi. Aks holda bitta satr o'zgarsa ham
    // foydalanuvchi 240 kB ni qaytadan yuklardi.
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: 'antd',
              test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-)/,
            },
            // Qolgan barcha kutubxonalar: react-query, axios, router,
            // dayjs. Ular ham kamdan-kam o'zgaradi, shuning uchun ilova
            // kodidan ajratilishi kerak — aks holda bitta satr
            // tuzatilganda foydalanuvchi ularni ham qaytadan yuklardi.
            //
            // Guruh ATAYLAB oxirida: rolldown modulni birinchi mos
            // kelgan guruhga qo'yadi, shuning uchun keng qamrovli
            // qoida aniqlaridan keyin turishi shart.
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    /*
     * Standart 5 soniya bu testlar uchun kam. Ular butun ilovani
     * (marshrutlar, layout, MSW) ko'tarib, foydalanuvchi harakatlarini
     * belgima-belgi bajaradi — bitta testda oyna ochish, ikki maydon
     * to'ldirish va ikki ro'yxatdan tanlash bor. To'liq yugurishda,
     * fayllar CPU uchun raqobatlashganda, chegaraga tegib ketardi.
     * Bu kutish muddati, tekshiruv emas: tasdiqlar o'zgarmadi.
     */
    testTimeout: 15_000,
    /*
     * Parallel fayllar soni cheklangan. Bu testlar butun ilovani
     * ko'taradi va antd uslublarini hisoblaydi — ya'ni ular protsessorga
     * bog'liq. Sakkizta yadroda o'nlab fayl birdan ishlaganda har biri
     * bir necha barobar sekinlashadi va sog'lom testlar ham muddatga
     * tegib yiqiladi.
     *
     * Chegara umumiy vaqtni deyarli o'zgartirmaydi (ish baribir shu),
     * lekin natijani BARQAROR qiladi.
     */
    maxWorkers: 4,
  },
});
