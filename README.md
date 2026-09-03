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
    auth/  dashboard/  members/  organization/  platform/
    venues/       stadion, ish vaqti, narx, foto, yopilish
    bookings/     kalendar, bron kartochkasi va amallari
      calendar/   panjaraning joylashuvi va ustunlari
    customers/    mijoz bazasi va kartochkasi
    series/       takrorlanuvchi bron
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

**Bosh sahifa hamma uchun bitta — `/dashboard`.** Manzil hisobga
bog'lanmaydi, o'zgaradigani panelning MAZMUNI: platforma ruxsati
bo'lganga platforma holati, tashkilot xodimiga esa uning bugungi kuni
ko'rsatiladi. Ilgari `/` menyudagi birinchi ochiq bo'limga yuborardi va
platforma xodimi `/platform/organizations` da paydo bo'lardi — bir xodim
yuborgan havola boshqasida boshqa sahifani ochardi.

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

## Platforma paneli

`SUPER_ADMIN` uchun alohida bo'lim: tashkilotlar ro'yxati, yangi
tashkilot ochish, profil va obuna muddati, bloklash.

Ikkita nozik joyni yodda tuting:

**Holat ikkita.** `subscriptionStatus` — bazadagi ustun,
`effectiveStatus` — amaldagi holat. Obuna sanasi hech kim tegmasdan
o'tib ketadi, shuning uchun ustunda `ACTIVE` turgan tashkilot amalda
`EXPIRED` bo'lishi mumkin. **Ko'rsatiladigan holat har doim
`effectiveStatus`**, bloklash tugmalari esa **ustunga** qaraydi —
backend ham shunday qaraydi va muddati tugagan tashkilotni qo'lda ham
bloklash mumkin.

**`DELETE` yo'q va bo'lmaydi.** Tashkilotni o'chirish uning bronlari,
to'lovlari va audit jurnalini ham olib ketardi. Ish to'xtatilishi kerak
bo'lsa — bloklanadi.

## Stadionlar

Ro'yxat, profil, arxivlash va kartochkada beshta bo'lim: ish vaqti,
narxlar, fotolar, yopilishlar.

**Ro'yxatni to'liq almashtiruvchi `PUT` lar.** Ish vaqti shunday
ishlaydi: ro'yxatga kirmagan kun yopiq hisoblanadi. Shuning uchun forma
haftaning yettala kunini ko'rsatadi — "kun qo'shish" tugmasi bo'lganda
bitta kunni tahrirlagan odam qolganlarini bilmasdan yopib qo'yardi.

**Bazaviy narx qoidasi majburiy.** Usiz bron umuman yaratilmaydi, shuning
uchun yo'qligi narxlar bo'limida darhol ogohlantirish bilan ko'rinadi.

**Vaqt: devor soati Toshkentda o'qiladi.** `DatePicker` brauzer
mintaqasida qiymat qaytaradi, adminka esa har doim Toshkent vaqtida
ishlaydi. O'girish `tashkentToIso` orqali — `toISOString()` ni
to'g'ridan-to'g'ri ishlatish boshqa mintaqadagi foydalanuvchida boshqa
soatni yuborardi.

**Fayl havolalari.** Backend `/api/v1/files/:id` qaytaradi — server
ildizidan. `<img src>` ga qo'yishdan oldin `assetUrl()` bilan backend
manzili qo'shiladi, aks holda brauzer uni adminka manzilidan qidiradi.

## Bronlar, mijozlar va seriya

`/bookings` uchta tabdan iborat: kunlik kalendar, qidiruv ro'yxati va
takrorlanuvchi bronlar. Ochilgan bron manzilda saqlanadi (`?booking=`) —
kartochka havolasini yuborish mumkin.

**Panjara ikki qatlam.** Fon kataklari ish vaqtidan chiziladi, bronlar
esa ularning ustiga BITTA blok bo'lib tushadi: ikki soatlik o'yin ikkita
katak emas, bitta uzun blok. Hisob-kitob `bookings/calendar/grid.ts` da
va DOM siz sinaladi.

**Narx oldindan ko'rsatilmaydi.** Uni narx qoidalaridan server hisoblaydi;
frontendda takrorlansa ikki xil raqam chiqish xavfi bor. Bron
yaratilgandan keyin kartochkada ko'rinadi.

## Hozircha yo'q

To'lovlar (M8), smenalar (M9), hisobotlar (M10) va bildirishnomalar (M12).
