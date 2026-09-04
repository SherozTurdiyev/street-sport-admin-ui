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

## Kassa: to'lov va smena

**To'lov bron kartochkasida.** Yon panelda balans (to'langan / qarz /
qaytarilgan), to'lovlar tarixi va ikkita amal. Summa oldindan qolgan
qarz bilan to'ldiriladi — kassada eng ko'p uchraydigan holat
"hammasini to'ladi".

**Pul yozuvi o'chirilmaydi.** Backendda `DELETE` ham, `PATCH` ham yo'q:
xato qaytarish bilan tuzatiladi va ikkala yozuv tarixda qoladi.
Shuning uchun interfeysda ham tahrirlash tugmasi yo'q.

**Qaytarish administratorga yopiq.** `payment.refund` unda yo'q —
qaytarish suiiste'molning eng oson yo'li. Tugma umuman chizilmaydi.

**Smena — `/shifts`.** Yuqorida joriy smena: kutilayotgan qoldiq va
uning tarkibi. Yopishda tizim hisobi ko'rsatiladi va sanalgan summa
o'sha raqam bilan oldindan to'ldiriladi. Farq yopishga to'sqinlik
qilmaydi: aks holda kassir raqamni tizimga moslab yozardi.

Naqd to'lov ochiq smenani talab qiladi (server `SHIFT_REQUIRED`
qaytaradi). Smena yo'q bo'lganda kartochka buni oldindan aytadi.

## Hisobotlar

`/reports` — yettita hisobot, bitta sahifada tab bilan. Foydalanuvchi
faqat **ruxsati bor** tab'larni ko'radi: direktorga yettalasi,
menejerga bandlik, bekor qilish va qarzdorlar, administratorga faqat
qarzdorlar.

- **Daromad kassa asosida.** Shu davrda qabul qilingan to'lovlardan
  qaytarishlar ayriladi. Bron qilingan-u to'lanmagan pul daromadda
  emas — u qarzdorlik hisobotida turadi.
- **Sana oralig'i URL da.** Hisobotga havola yuborilganda qabul
  qiluvchi aynan o'sha raqamlarni ko'radi. Tushum va qarzdorlar
  tab'larida oraliq o'chirilgan: birinchisida davrlar qat'iy
  (bugun/hafta/oy), ikkinchisida qarz — joriy holat.
- **O'sish foizi noldan hisoblanmaydi.** Backend `null` qaytaradi,
  adminka esa "+100%" deb to'ldirmaydi — o'rniga "solishtirish uchun
  ma'lumot yo'q" deb yozadi.
- **CSV alohida ruxsat talab qiladi** (`export.data`). Tugma bu ruxsat
  yo'q foydalanuvchiga umuman chizilmaydi. Fayl `;` ajratkich va UTF-8
  BOM bilan keladi — Excel uni to'g'ri ochadi.
- **Diagramma kutubxonasi yo'q.** Ulushlar CSS ustunchalari bilan
  chiziladi; raqam har doim yonida turadi.

## Audit jurnali

`/audit` — kim, qachon, nima qilgani. Bo'lim **faqat direktorga**
ko'rinadi (`audit.view`, TZ 4.3).

- **Tarjima backenddan keladi.** `actionLabel`, `entityLabel` va maydon
  nomlari javobda tayyor matn bo'lib turadi. Adminka o'z lug'atini
  yuritmaydi: CSV faylini ham backend yasaydi, ikkita lug'at esa bir
  kun kelib bir-biridan farq qilardi.
- **O'zgarishlar kengaytiriladigan qatorda.** Bitta amal beshta
  maydonni o'zgartirishi mumkin — ular asosiy jadvalda qator
  balandligini o'nlab piksel qilib yuborardi. O'zgarishsiz yozuvda
  kengaytirish tugmasi umuman chizilmaydi.
- **Obyektga havola turi bo'yicha.** Stadion, ish vaqti, yopilish va
  foto — `/venues/:id` ga; xodim — `/members` ga. Bron va to'lovda
  havola yo'q, chunki adminkada ularning o'z manzili yo'q: ishlamaydigan
  havoladan ko'ra ko'chiriladigan identifikator foydaliroq.
- **Filtrlar URL da** — topilgan izni hamkasbga havola qilib yuborish
  mumkin.

## Hozircha yo'q

Bildirishnomalar (M12) — qo'ng'iroqcha hali doim nolda, chunki
backendda o'qish endpointi yo'q.
