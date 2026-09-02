# StreetSport — boshqaruv paneli

Stadion boshqaruv tizimining adminkasi. React SPA; backend alohida
loyihada (`street-sport-back-api`).

## Ishga tushirish

Avval backend ishlab turishi kerak (`http://localhost:3001`).

```bash
npm ci
cp .env.example .env
npm run dev
```

Sahifa `http://localhost:5173` da ochiladi. **Port qotirilgan** —
backenddagi `CORS_ORIGINS` da aynan shu port bor. Vite boshqa portga
o'tsa cookie yuborilmaydi va login jimgina ishlamay qoladi.

| Buyruq               | Vazifasi                      |
| -------------------- | ----------------------------- |
| `npm run dev`        | Ishlab chiqish serveri        |
| `npm run build`      | Ishlab chiqarish uchun qurish |
| `npm test`           | Barcha testlar                |
| `npm run test:watch` | Testlar kuzatuv rejimida      |
| `npm run lint`       | oxlint                        |
| `npm run format`     | prettier                      |

## Muhit o'zgaruvchilari

| O'zgaruvchi    | Ma'nosi                                |
| -------------- | -------------------------------------- |
| `VITE_API_URL` | Backend manzili, `/api/v1` bilan birga |

Boshqa o'zgaruvchi yo'q. Sir saqlanmaydi: Vite `VITE_` bilan
boshlanadigan hamma narsani qurilgan faylga yozadi va uni brauzerdan
o'qish mumkin.

## Papka tuzilishi

```
src/
  app/          ilova qobig'i
    guards/     marshrut qo'riqchilari
    layout/     AppLayout, menyu jadvali
  features/     bo'limlar — har biri o'z api/hooks/sahifalari bilan
    auth/  members/  organization/  venues/
  shared/
    api/        axios mijozi, token, xatolar, umumiy tiplar
    format/     sana va pul
    theme/      Figma tokenlari va antd mavzusi
    ui/         kichik umumiy komponentlar
  test/         MSW, render yordamchisi, ssenariy testi
tools/          lint o'rnini bosuvchi tekshiruvlar
```

Har bir `feature` o'zining `api.ts` iga ega va **o'sha bo'limning
tiplari shu faylda yashaydi**. Tiplar qo'lda yozilgan; keyin OpenAPI dan
generatsiyaga o'tilsa, faqat `api.ts` lar almashadi.

## Qoidalar

Bular tasodifiy uslub emas — har birining orqasida sabab bor.

**Rol bo'yicha qaror qabul qilinmaydi.** `user.role === 'DIRECTOR'`
ko'rinishidagi solishtirish taqiqlanadi (TZ 4.4). Qaror faqat
`permissions` bo'yicha: `useCan()('member.admin.manage')`. Rol faqat
ekranda ko'rsatish uchun (`ROLE_LABELS`).

Qoida `tools/role-comparison.test.ts` bilan majburlanadi. oxlint da
`no-restricted-syntax` yo'q, shuning uchun tekshiruv test sifatida
yozilgan va `npm test` bilan ishlaydi.

**Xato matni frontendda yozilmaydi.** Backend `message` ni o'zbek
tilida, foydalanuvchiga ko'rsatishga tayyor holda qaytaradi. Yagona
istisno — javob umuman kelmagan holat (`NETWORK_ERROR`), u yerda backend
hech narsa aytmagan. Aks holda bitta holat uchun ikki joyda ikki xil
matn bo'lardi.

**Pul — satr.** Backend pulni satr sifatida qaytaradi va u shunday
qoladi (BR-13). `Number` ga o'girish mumkin emas: JavaScript butun
sonlarni faqat 2^53 gacha aniq saqlaydi. Ko'rsatish uchun
`formatMoney`.

**Vaqt — Toshkent.** Backend UTC ISO qaytaradi, ekranda har doim
`Asia/Tashkent`. O'girish faqat `shared/format/time.ts` da.

**Tailwind faqat joylashuv uchun**: `flex`, `grid`, `gap`, chetlar,
kengliklar. Rang, shrift va komponentlar antd dan. Ranglar
`shared/theme/tokens.ts` da yig'ilgan va antd mavzusiga uzatiladi.

**Access token faqat xotirada.** `localStorage` da emas: u yerda
saqlansa har qanday XSS uni o'g'irlab, cheksiz muddatga foydalana
olardi. Refresh token `httpOnly` cookie'da va JavaScript uni ko'rmaydi.

**Sahifalash server tomonda.** `page` va `pageSize` nomlari backend
bilan bir xil, shuning uchun o'girish kerak emas.

## Sinov

```bash
npm test
```

Testlar jsdom da, so'rovlar MSW bilan mock qilinadi. **Mock qilinmagan
so'rov testni yiqitadi** (`onUnhandledRequest: 'error'`) — shuning uchun
so'rovning ketmagani ham test bilan isbotlanadi.

Ko'pchilik testlar butun ilovani (`AppRouter`) ko'taradi. Bu sekinroq,
lekin marshrut, ruxsat va kesh bilan birga tekshiradi. To'liq zanjir —
`src/test/scenario.test.tsx`.

## Hozircha yo'q

Stadionlar, narx qoidalari, mijozlar, kalendar, bron, to'lovlar,
platforma paneli. Platforma xodimi (`SUPER_ADMIN`) kirsa buni
tushuntiruvchi sahifa ko'radi: uning bo'limlari backendda tayyor
(`/platform/*`), adminkada esa hali qurilmagan.
