# Adminka 1-bosqich — poydevor va xodimlar

**Sana:** 28.08.2026
**Loyiha:** `street-sport-admin-ui`
**Backend:** `street-sport-back-api` — 64 endpoint tayyor, `docs/API.md` da
to'liq yozilgan

---

## 1. Nima quriladi

Stadion boshqaruv tizimining ichki boshqaruv paneli. Foydalanuvchilari —
stadion egasi (direktor), boshqaruvchi (menejer), stadion administratori
va platforma xodimi.

Bu bosqich oxirida ishlaydigan narsa:

> Foydalanuvchi tizimga kiradi, chap menyuda **faqat o'ziga ruxsat
> etilgan** bo'limlarni ko'radi, xodimlar ro'yxatini ochadi, filtrlaydi,
> yangi xodim qo'shadi va vaqtinchalik parolni ekranda oladi, rolini
> o'zgartiradi, faolsizlantiradi va stadion biriktiradi.

Bu eng kichik **to'liq** oqim: ro'yxat, sahifalash, filtr, forma, server
xatolari, ruxsat va ikki bosqichli amal (parol) — hammasi bir bo'limda.
Zanjirning har bir bo'g'ini uchidan-uchiga isbotlanadi, keyingi bo'limlar
esa tayyor poydevorga qo'nadi.

### Bu bosqichda QILINMAYDI

Stadionlar, narx qoidalari, mijozlar, kalendar, bron, seriya, platforma
paneli, fayl yuklash. Ular keyingi bosqichlarda — poydevor tayyor
bo'lgach har biri qisqa ish bo'ladi.

---

## 2. Texnologiyalar

| Paket | Versiya | Vazifasi |
|---|---|---|
| React | 19.2 | |
| Vite | 8.2 | Qurilish |
| TypeScript | 5, `strict` | |
| antd | 6.6 | Komponentlar |
| Tailwind CSS | 4.3 | **Faqat joylashuv** |
| @tanstack/react-query | 5.102 | Server holati |
| axios | 1.20 | HTTP |
| react-router | 7 | Marshrutlash |
| dayjs | antd bilan keladi | Sana va vaqt |
| Vitest + Testing Library + MSW | | Testlar |

**Alohida sana kutubxonasi qo'shilmaydi.** antd allaqachon `dayjs` ga
tayanadi; ikkinchisini qo'shish bitta loyihada ikki xil sana turi degani
va ular chegarada bir-biriga o'girilishi kerak bo'lardi.

**Klient holati uchun alohida kutubxona (Redux, Zustand) yo'q.** Bu
ilovadagi holatning deyarli hammasi serverdan keladi va uni react-query
boshqaradi. Qolgani — kirgan foydalanuvchi — bitta React kontekstiga
sig'adi.

### Ma'lum xavf

antd 6 va Tailwind 4 — ikkalasi ham yangi. Tailwind 4 da konfiguratsiya
butunlay o'zgargan (CSS-first, `tailwind.config.js` yo'q). Ikkalasi ham
React 19 ni qo'llab-quvvatlaydi, lekin birga ishlatishda kutilmagan
narsa chiqishi mumkin.

Yumshatish: Tailwind faqat joylashuv uchun ishlatiladi va uning
`preflight` i o'chiriladi. Agar to'qnashuv chiqsa, Tailwind ni olib
tashlab antd ning `Flex`/`Space` iga o'tish bir kunlik ish — chunki
Tailwind hech qanday komponent ichida ishlatilmaydi.

---

## 3. Papka tuzilishi

```
src/
  app/
    router.tsx          marshrutlar
    providers.tsx       QueryClient, ConfigProvider, AuthProvider
    layout/             AppLayout, Sidebar, Header
    guards/             RequireAuth, RequirePermission
  shared/
    api/
      client.ts         axios instansiyasi va interceptorlar
      token.ts          xotiradagi access token
      errors.ts         AppError turi va xato ishlovchisi
    hooks/
    ui/                 umumiy kichik komponentlar
    format/
      money.ts
      time.ts
  features/
    auth/
      api.ts            so'rovlar + tiplar
      hooks.ts          react-query
      LoginPage.tsx
      ChangePasswordPage.tsx
      AuthProvider.tsx
    members/
      api.ts
      hooks.ts
      MembersPage.tsx
      MemberFormModal.tsx
      MemberCardDrawer.tsx
```

Har bir `feature` o'zining `api.ts` iga ega va **shu bo'limning tiplari
o'sha faylda yashaydi**. Tiplar qo'lda yozilgani uchun bu muhim: keyin
OpenAPI dan generatsiyaga o'tishga qaror qilinsa, faqat `api.ts` lar
almashadi, komponentlarga tegilmaydi.

Bo'limlar bir-birini **import qilmaydi**. Umumiy narsa kerak bo'lsa u
`shared/` ga chiqadi.

---

## 4. Autentifikatsiya

Eng nozik qism. Backend ikkita token ishlatadi:

| Token | Qayerda | Muddat |
|---|---|---|
| Access | `Authorization: Bearer` sarlavhasida | 15 daqiqa |
| Refresh | `refresh_token` httpOnly cookie | 30 kun |

### Access token faqat xotirada

`localStorage` da saqlanmaydi. Sabab: `localStorage` ga XSS orqali
yetish mumkin, modul o'zgaruvchisiga esa yo'q. Refresh token allaqachon
`httpOnly` cookie'da va JavaScript uni umuman ko'rmaydi.

Buning narxi: sahifa yangilanganda access token yo'qoladi. Yechim —
ilova ishga tushganda `POST /auth/refresh` chaqiriladi. Cookie saqlanib
qolgani uchun yangi token keladi va foydalanuvchi qayta login qilmaydi.

Ya'ni ilovaning birinchi holati **"noma'lum"** bo'ladi: hali login
qilinganmi yoki yo'qmi bilinmaydi. Shu vaqt oralig'ida to'liq ekranli
yuklanish ko'rsatiladi — aks holda login sahifasi bir lahza chaqnab,
keyin ichki sahifaga o'tardi.

### axios konfiguratsiyasi

```
baseURL:         import.meta.env.VITE_API_URL   (masalan http://localhost:3001/api/v1)
withCredentials: true                            cookie usiz refresh ishlamaydi
```

### 401 da nima bo'ladi

```
so'rov → 401
  → refresh (bitta marta, hamma uchun umumiy)
      muvaffaqiyat → asl so'rov yangi token bilan qayta yuboriladi
      xato        → token tozalanadi, login sahifasiga
```

**Bir vaqtda bir necha so'rov 401 olsa, refresh faqat BIR MARTA
ketishi shart.** Backend refresh tokenni har chaqiruvda almashtiradi
(rotatsiya), ya'ni ikkinchi parallel refresh birinchisi yaratgan
tokenni yaroqsiz qiladi va foydalanuvchi tizimdan tushib ketadi.
Yechim: davom etayotgan refresh `Promise` i modul darajasida saqlanadi,
qolgan so'rovlar o'shani kutadi.

`/auth/login` va `/auth/refresh` ning o'zidan kelgan 401 qayta
urinilmaydi — aks holda cheksiz halqa hosil bo'lardi.

### Parol almashtirish majburiyati

`mustChangePassword: true` bo'lsa backend boshqa endpointlarga
`AUTH_PASSWORD_CHANGE_REQUIRED` (403) qaytaradi. Frontend ham shunga
mos: bunday foydalanuvchi `/change-password` dan boshqa marshrutga o'ta
olmaydi.

---

## 5. Ruxsat — rol emas

Backendda `if (role === 'DIRECTOR')` taqiqlangan va ESLint qoidasi buni
qo'riqlaydi (TZ 4.4). Frontendda ham xuddi shunday.

`GET /auth/me` javobidagi `permissions` massivi **yagona manba**:

```ts
const can = useCan();
can('member.admin.manage')   // true | false
```

```tsx
<RequirePermission permission="member.admin.manage">
  <MembersPage />
</RequirePermission>
```

Menyu ham shu jadvaldan yasaladi:

| Marshrut | Ruxsat | Menyu nomi |
|---|---|---|
| `/members` | `member.admin.manage` | Xodimlar |
| `/organization` | — (hamma ko'radi) | Tashkilot |

Keyingi bosqichlarda jadval kengayadi. Ruxsati yo'q bo'lim menyuda
umuman ko'rinmaydi; manzilni qo'lda yozib kirsa "ruxsat yo'q" sahifasi
chiqadi.

**ESLint qoidasi qo'shiladi:** `user.role === '...'` ko'rinishidagi
solishtirish taqiqlanadi — backenddagi qoidaning aynan o'zi. Rol
faqat ekranda ko'rsatish uchun ishlatiladi.

---

## 6. react-query konvensiyalari

**Kalitlar.** `['members', filtrlar]` — filtr obyekti kalitning bir
qismi, shuning uchun sahifa yoki filtr o'zgarganda so'rov o'zi qayta
ketadi va natija keshlanadi.

**Standart sozlamalar:**

```
staleTime: 30_000
retry:     4xx da urinilmaydi; 5xx da bir marta
refetchOnWindowFocus: false
```

4xx ni qayta so'rashning ma'nosi yo'q: 403 uch marta ham 403 qaytaradi,
foydalanuvchi esa uch barobar kutadi.

**Mutatsiyalar.** Muvaffaqiyatdan keyin tegishli ro'yxat kaliti bekor
qilinadi (`invalidateQueries`). Optimistik yangilash **ishlatilmaydi**:
bu ilovada amallar server tomonda qoidalarga (BR-01, ierarxiya, oxirgi
direktor) bog'liq va ular klientda takrorlanmaydi. Optimistik ko'rsatib,
keyin orqaga qaytarish foydalanuvchini chalg'itadi.

**Sahifalash.** Server tomonda. antd `Table` ning `pagination` i
to'g'ridan-to'g'ri `page` va `pageSize` ga ulanadi — nomlar backend
bilan **bir xil**, o'girish kerak emas.

Javob shakli har doim:

```json
{ "items": [], "total": 42, "page": 1, "pageSize": 20 }
```

---

## 7. Xatolar

Backend har doim shu shaklni qaytaradi:

```json
{ "code": "MEMBER_VENUE_REQUIRED", "message": "Administrator uchun kamida bitta stadion tanlanishi shart.", "details": {} }
```

`message` — **o'zbek tilida, foydalanuvchiga ko'rsatishga tayyor**.
Frontend uni qayta yozmaydi va o'zi matn o'ylab topmaydi. Aks holda
bitta holat uchun ikki joyda ikki xil matn bo'lardi va ular vaqt o'tishi
bilan bir-biridan uzoqlashardi.

Ishlov berish:

| Holat | Nima bo'ladi |
|---|---|
| `401` | Refresh, keyin login (4-bo'lim) |
| `402` `SUBSCRIPTION_EXPIRED` | Butun ilova ustida banner: obuna tugagan, faqat o'qish |
| `403` `FORBIDDEN` | "Ruxsat yo'q" sahifasi |
| `403` `VENUE_ACCESS_DENIED` | Xabar: bu stadion sizga biriktirilmagan |
| `400` `VALIDATION_FAILED` | `details.message` forma maydonlariga tushadi |
| Qolgani | antd `message.error(message)` |

Tarmoq uzilgan holat ham shu yerda: javob umuman kelmasa, `code`
o'rniga umumiy xabar ko'rsatiladi.

---

## 8. Antd va Tailwind

**Tailwind faqat joylashuv uchun**: `flex`, `grid`, `gap`, chetlar,
kengliklar. Ranglar, shriftlar, tugmalar, jadvallar — hammasi antd dan.

**`preflight` o'chiriladi.** Tailwind ning bazaviy uslublari antd
komponentlarining ko'rinishini buzadi. Tailwind 4 da buni `preflight.css`
ni import qilmaslik orqali qilinadi:

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

`ConfigProvider` da o'zbek lokali: `antd/locale/uz_UZ` mavjudligi
tekshirildi. Jadval, sana tanlash va sahifalash matnlari o'zbekcha
bo'ladi — ular uchun alohida tarjima yozilmaydi.

---

## 9. Formalar

**antd `Form`**, react-hook-form emas. Antd inputlari o'z `Form` i bilan
ishlaydi; ikkinchi validatsiya tizimi qo'shish har bir input uchun
o'rov yozishni talab qilardi.

Klient tomonda faqat **shakl** tekshiriladi (majburiy maydon, telefon
ko'rinishi). Qoidalar — telefon bandligi, ierarxiya, oxirgi direktor —
serverda va ular klientda takrorlanmaydi: ikki joyda yozilgan qoida
ertami-kechmi bir-biridan farq qila boshlaydi.

Server validatsiya xatosi maydonlarga `form.setFields` orqali
qaytariladi.

---

## 10. Pul va vaqt

**Pul.** Backend satr qaytaradi: `"150000"`. Sabab — JavaScript ning
`number` i 2⁵³ dan katta butun sonlarni aniq saqlay olmaydi. Frontend
uni **hech qayerda `number` ga o'girmaydi**: ko'rsatishda
`Intl.NumberFormat` bilan bo'linadi, yuborishda yana satr.

`shared/format/money.ts`: `formatMoney("150000") → "150 000"` va
`parseMoney("150 000") → "150000"`.

**Vaqt.** Backend UTC ISO qaytaradi, ekranda Toshkent vaqti.
`shared/format/time.ts` bitta joyda o'giradi. Komponentlarda `new Date()`
bilan qo'lda hisob-kitob yozilmaydi.

Ish vaqti (`opensAt`, `closesAt`) va seriya `startTime` esa allaqachon
Toshkent mahalliy vaqti — ular o'girilmaydi.

---

## 11. Testlash

Vitest + Testing Library + MSW.

Backendda baza mock qilinmagani kabi, bu yerda ham ilovaning ichki
qismlari mock qilinmaydi. MSW HTTP darajasida javob beradi; ilova
haqiqiy axios, haqiqiy react-query va haqiqiy komponentlar bilan
ishlaydi. Test foydalanuvchi ko'radigan narsani tekshiradi, ichki
funksiya chaqirilganini emas.

Bu bosqichda majburiy testlar:

1. Login muvaffaqiyatli — token saqlanadi, ichki sahifaga o'tiladi
2. Login xato — backend xabari ekranda ko'rinadi
3. 401 dan keyin refresh ishlaydi va so'rov qayta yuboriladi
4. Bir vaqtda ikkita 401 — refresh **bir marta** ketadi
5. `mustChangePassword` — boshqa marshrutga o'tib bo'lmaydi
6. Ruxsati yo'q bo'lim menyuda ko'rinmaydi
7. Xodimlar ro'yxati sahifalanadi va filtrlanadi
8. Xodim yaratiladi, vaqtinchalik parol ko'rsatiladi
9. Server validatsiya xatosi forma maydoniga tushadi
10. `MEMBER_VENUE_REQUIRED` xabari ekranda ko'rinadi

4-test alohida muhim: refresh rotatsiyasi tufayli parallel refresh
foydalanuvchini tizimdan chiqarib yuboradi va bu xato faqat real
sharoitda, tasodifiy chiqadi.

---

## 12. Muhit sozlamalari

`.env` fayli:

```
VITE_API_URL=http://localhost:3001/api/v1
```

Backend `.env` idagi `CORS_ORIGINS` allaqachon `http://localhost:5173` —
Vite ning standart porti. Ya'ni backendga tegish shart emas. Vite boshqa
portda ishga tushsa (5173 band bo'lsa), cookie yuborilmaydi va login
ishlamaydi — shu holatda port qo'lda 5173 ga qotiriladi.

---

## 13. Qabul mezonlari

Bosqich tugadi deyish uchun:

1. `npm run lint && npm run build && npm run test` — yashil
2. Direktor login qiladi, xodim qo'shadi, vaqtinchalik parolni ko'radi
3. Yangi xodim o'sha parol bilan kiradi va parol almashtirish ekraniga
   majburan tushadi
4. Administrator login qilganda menyuda "Xodimlar" ko'rinmaydi
5. `/members` ga qo'lda kirsa "ruxsat yo'q" sahifasi chiqadi
6. Sahifa yangilanganda foydalanuvchi tizimda qoladi
7. Access token muddati tugagach so'rov o'zi tiklanadi, foydalanuvchi
   buni sezmaydi
8. Barcha xato xabarlari o'zbek tilida va backenddan kelgan
