# Adminka 3-bosqich — bron, mijoz va seriya (M5, M6, M7)

**Sana:** 02.09.2026
**Oldingi bosqich:** [2-bosqich — stadionlar va narxlar](2026-08-28-admin-ui-1-bosqich-design.md)

---

## 1. Nima uchun bu bosqich

Backend bron qabul qilishga to'liq tayyor: mijozlar, kunlik kalendar,
bron yaratish/ko'chirish/bekor qilish, o'yin natijasi va takrorlanuvchi
seriya — hammasi yozilgan va testlangan. Adminkada esa bularning
**birortasi ham yo'q**.

Ya'ni hozir administrator o'zining asosiy ishini — telefon qilgan
mijozga bron ochishni — umuman qila olmaydi. Bu bosqich shu bo'shliqni
yopadi va mahsulotni ishlaydigan holga keltiradi.

---

## 2. Backend nima beradi

Hammasi tayyor, yangi endpoint yozilmaydi (`docs/API.md`, 10–12-bo'limlar):

| Endpoint                                     | Nima uchun kerak                                         |
| -------------------------------------------- | -------------------------------------------------------- |
| `GET /bookings/calendar/day`                 | Panjara: ish vaqti, yopilishlar va bronlar bitta javobda |
| `POST /bookings`                             | Bron yaratish; narx server tomonda hisoblanadi           |
| `GET /bookings`                              | Ro'yxat: qidiruv, holat, stadion, sana oralig'i          |
| `GET /bookings/:id`                          | Kartochka: stadion va mijoz bilan                        |
| `PATCH /bookings/:id/move`                   | Ko'chirish va davomiylikni o'zgartirish                  |
| `POST /bookings/:id/cancel`                  | Bekor qilish, sabab majburiy (BR-07)                     |
| `POST /bookings/:id/result`                  | `COMPLETED` yoki `NO_SHOW`                               |
| `POST /customers/lookup`                     | Telefon → topadi yoki darrov yaratadi                    |
| `GET/PATCH /customers`, `/customers/:id`     | Ro'yxat, kartochka, tahrirlash                           |
| `PATCH /customers/:id/blacklist`             | Qora ro'yxat                                             |
| `POST /booking-series/preview`               | Yaratishdan oldin sanalar holati                         |
| `POST /booking-series`                       | Seriya yaratish (`SKIP` / `ABORT`)                       |
| `GET /booking-series`, `/:id`                | Ro'yxat va kartochka                                     |
| `POST /booking-series/:id/extend`, `/cancel` | Uzaytirish, butunlay bekor qilish                        |

---

## 3. Tasdiqlangan qarorlar

02.09.2026 da kelishildi:

1. **Kalendar panjarasi o'zimizniki.** Tayyor rejalashtiruvchi
   kutubxona olinmaydi.
2. **Seriya alohida bo'lim emas** — `/bookings` ichidagi uchinchi tab.
3. **Sudrab ko'chirish yo'q.** Ko'chirish oyna orqali.
4. Maket yo'q: mavjud uslub davom ettiriladi (kartochka, `StatCard`,
   antd jadval va tab'lar).
5. Yetkazib berish tartibi: **M6 → M5 → M7**, har biri alohida.

### Nega tayyor kutubxona emas

FullCalendar va react-big-calendar sudrab ko'chirishni tekin beradi,
lekin uchta narxi bor: og'ir bog'liqlik, qorong'i mavzuga moslash
qiyinligi va o'z vaqt mintaqasi mantig'i. Bizda esa Toshkent kuni
chegarasi **serverdan** keladi (`from`/`to`) va mintaqa hisob-kitobi
ikki joyda takrorlanmasligi kerak. Ustiga, `slots.ts` da panjara
mantig'i allaqachon yozilgan va sof funksiya sifatida testlangan —
uni tashlab, kutubxona sozlashga o'tish yutuq bermaydi.

### Nega sudrab ko'chirish yo'q

Zich panjarada sichqoncha bilan xato bosish oson, natijasi esa —
noto'g'ri vaqtga ko'chirilgan bron. Ustiga, uni jsdom'da test bilan
qo'riqlab bo'lmaydi. Ko'chirish oynada bajariladi: yangi vaqt aniq
ko'rsatiladi va narx o'zgarsa tasdiq so'raladi. Keyinchalik qo'shish
mumkin — panjara tayyor bo'lgach, ustiga sudrash qo'shiladi.

---

## 4. Navigatsiya va manzillar

Yon panelga **ikkita** bo'lim qo'shiladi. Uchinchisi qo'shilmaydi:
yettita bo'lim ro'yxatni o'qishni qiyinlashtiradi, seriya esa bron
bilan bir xil kontekstda yashaydi.

| Manzil                   | Ekran                                     | Ruxsat         |
| ------------------------ | ----------------------------------------- | -------------- |
| `/bookings`              | Uchta tab: Kalendar · Ro'yxat · Seriyalar | kirgan har kim |
| `/bookings?booking=<id>` | Bron kartochkasi (chekka oyna)            | kirgan har kim |
| `/bookings/series/:id`   | Seriya sahifasi                           | kirgan har kim |
| `/customers`             | Mijozlar ro'yxati                         | kirgan har kim |
| `/customers/:id`         | Mijoz sahifasi                            | kirgan har kim |

Bron kartochkasi **alohida manzil emas, qidiruv parametri**: u
kalendardan ochilganda orqadagi panjara joyida qoladi, lekin havolani
yuborish ham mumkin. Bu `?tab=` bilan bir xil yondashuv — 2-bosqichda
kiritilgan va o'zini oqlagan.

Seriya sahifasi `/bookings/series/:id` ostida: shunda sarlavhadagi
yo'lakcha (`Breadcrumbs`) uni «Bronlar» bo'limining ichi deb taniydi.

---

## 5. M6 — kalendar va bron

### 5.1 Panjara

Panjara **ikki qatlamdan** iborat:

1. **Fon** — bo'sh, yopiq va o'tib ketgan kataklar. `buildSlots()` dan
   keladi, bron biriktirilganlari tashlab yuboriladi.
2. **Bronlar** — har bir faol bron **bitta blok**. Ikki soatlik bron
   ikkita katak emas, bitta uzun blok bo'lib chiziladi.

Ikki qatlamga bo'lish shart: `buildSlots()` bir bronni o'zi tegib
turgan har bir katakka qo'yadi, kalendarda esa bron yaxlit ko'rinishi
kerak — aks holda uzun o'yin bo'lakka bo'linib ko'rinardi.

Vaqt o'qi — barcha ustunlarning eng erta ochilishidan eng kech
yopilishigacha. Daqiqa piksel bilan o'lchanadi (`PX_PER_MIN`), shuning
uchun `slotMinutes` har stadionda har xil bo'lsa ham ustunlar bir
o'qda turadi.

**Yangi sof funksiyalar** (`features/bookings/calendar/grid.ts`):

```ts
/** Kun boshidan (server bergan `from`) boshlab daqiqa. */
export function minutesFrom(dayStart: string, iso: string): number;

/** Barcha ustunlarni qamrovchi o'q. Hech biri ochiq bo'lmasa `null`. */
export function axisRange(
  venues: CalendarVenue[],
  weekday: number,
): { start: number; end: number } | null;

/** Soat yorliqlari: o'q ichidagi butun soatlar. */
export function hourTicks(range: { start: number; end: number }): number[];

/** Bron bloklari: joylashuvi daqiqada. */
export function bookingBlocks(
  venue: CalendarVenue,
  dayStart: string,
): { booking: Booking; top: number; height: number }[];
```

`slots.ts` `features/venues/detail/` dan `features/bookings/` ga
ko'chiriladi: u bron mantig'i va endi ikkita bo'lim uni ishlatadi.
Stadion sahifasi yangi manzildan import qiladi, mantiq o'zgarmaydi.

### 5.2 Ustunlar va filtr

Ustunlar — `GET /bookings/calendar/day` qaytargan stadionlar.
`venueIds` berilmasa server foydalanuvchiga ochiq hammasini beradi
(BR-08 backendda). Ustun ko'p bo'lsa filtr uchun ko'p tanlovli
ro'yxat: tanlangani `venueIds` ga tushadi.

Sana almashtirgich: «kecha / bugun / ertaga» tugmalari va sana
tanlagich. Boshlang'ich qiymat — **Toshkent bugungi kuni**
(`dayjs().tz(TASHKENT)`), brauzer mintaqasi emas (BR-12).

### 5.3 Tez bron

Bo'sh katak bosiladi → oyna ochiladi, ichida:

1. Stadion va vaqt **allaqachon to'ldirilgan** (katakdan olinadi),
   davomiylik tanlanadi (1×, 2×, 3× slot).
2. Telefon raqami — `PhoneInput` maskasi bilan. «Topish» bosilganda
   `POST /customers/lookup` chaqiriladi: mijoz topilsa ismi
   ko'rsatiladi, topilmasa ism so'raladi va o'sha chaqiruvda
   yaratiladi.
3. Chegirma va izoh — ixtiyoriy.
4. Saqlash → `POST /bookings`.

Anonim bron ham mumkin: telefon bo'sh qoldirilsa `customerId`
yuborilmaydi.

Narx **oldindan ko'rsatilmaydi** — u serverdan javob bilan keladi va
kartochkada ko'rinadi. Sabab: narx qoidalari server tomonda
hisoblanadi va uni frontendda takrorlash ikki xil raqam berish
xavfini tug'diradi. (Narxni oldindan ko'rsatish kerak bo'lsa,
`POST /venues/:id/price-rules/calculate` bor — keyingi bosqichda.)

### 5.4 Bron kartochkasi

Chekka oyna: stadion, vaqt, mijoz (havola bilan), narx, holat, izoh,
seriya bo'lsa unga havola. Amallar:

| Amal                     | Qachon ko'rinadi                     |
| ------------------------ | ------------------------------------ |
| Ko'chirish               | Bron bekor qilinmagan                |
| Bekor qilish             | Bron bekor qilinmagan                |
| «Yakunlandi» / «Kelmadi» | `endsAt` o'tgan va holat `CONFIRMED` |

Natija tugmasi vaqtidan oldin ko'rsatilmaydi: server `endsAt` gacha
`BOOKING_NOT_FINISHED` qaytaradi va ishlamaydigan tugma foydalanuvchini
chalg'itardi.

### 5.5 Ko'chirish va narx tasdig'i

Oynada yangi stadion, sana va vaqt tanlanadi. Server tarif zonasi
o'zgarganini aniqlasa `BOOKING_PRICE_CHANGED` (409) qaytaradi va
javobda eski hamda yangi narx keladi. Interfeys ikkalasini yonma-yon
ko'rsatib tasdiq so'raydi, keyin `confirmPriceChange: true` bilan
qayta yuboradi.

Shunchaki uzaytirish (1 soat → 2 soat) tasdiq so'ramaydi — soatlik
tarif o'zgarmagan.

### 5.6 Bekor qilish

Sabab **majburiy** (BR-07): `CANCEL_REASON_LABELS` dan tanlanadi
(u `features/venues/api.ts` da allaqachon bor va o'z joyiga —
`features/bookings/api.ts` ga ko'chiriladi). Izoh ixtiyoriy.

### 5.7 Ro'yxat tabi

antd jadval: sana/vaqt, stadion, mijoz, narx, holat. Filtrlar —
qidiruv (ism yoki telefon), holat, stadion, sana oralig'i. Qator
bosilsa o'sha kartochka ochiladi.

---

## 6. M5 — mijozlar

### 6.1 Ro'yxat

Jadval: ism, telefon (maskada), teglar, holat. Qidiruv `?search=`,
«faqat qora ro'yxat» belgisi `?blacklistedOnly=true`.

### 6.2 Mijoz sahifasi

- Sarlavha kartasi: ism, telefon, teglar, qora ro'yxat belgisi
- To'rtta ko'rsatkich: jami bronlar, yakunlangan, bekor qilingan,
  oxirgi tashrif
- **To'lov ko'rsatkichlari ko'rsatilmaydi.** `totalPaid` va
  `currentDebt` hozircha har doim `"0"` va javobda `pendingModule: "M8"`
  turadi. Nol raqamni ko'rsatish yolg'on bo'lardi — uning o'rniga
  «To'lovlar moduli qo'shilgach ko'rinadi» degan izoh turadi.
- Bronlar tarixi jadvali
- Tahrirlash: ism, izoh, teglar (telefon o'zgartirilmaydi — u mijozning
  identifikatori)
- Qora ro'yxat almashtirgichi — faqat `customer.blacklist` ruxsati
  bo'lganda

Qora ro'yxat bron yaratishni **taqiqlamaydi**: server javobida
`warnings: ["CUSTOMER_BLACKLISTED"]` keladi va u ogohlantirish bo'lib
ko'rsatiladi. Qaror operatorda.

---

## 7. M7 — seriya

### 7.1 Ro'yxat tabi

Jadval: stadion, mijoz, kunlar, vaqt, davri, soatlik narx. Filtr:
stadion, mijoz, «shuncha kun ichida tugaydiganlar»
(`expiringWithinDays`) — doimiy mijozni uzaytirishni eslatish shu
orqali qilinadi.

### 7.2 Yaratish — ikki qadam

**Qadam 1 — oldindan ko'rish.** Forma to'ldiriladi (stadion, hafta
kunlari, vaqt, davomiylik, davr) va `POST /booking-series/preview`
chaqiriladi. Javob jadval bo'lib ko'rsatiladi: har bir sana va uning
holati — `FREE`, `BUSY`, `OUTSIDE_HOURS`, `CLOSED`.

**Qadam 2 — yaratish.** Band sanalar bo'lsa foydalanuvchi tanlaydi:
`SKIP` (band sanalarni o'tkazib yuborish) yoki `ABORT` (hech narsa
yaratmaslik). Yaratilgandan keyin `skipped` ro'yxati ko'rsatiladi.

Oldindan ko'rishsiz yaratishga yo'l yo'q: 12 haftalik seriya 24 ta
bron degani va ularning qaysi biri band ekanini oldin ko'rish shart.

### 7.3 Seriya sahifasi

Sarlavha (stadion, mijoz, jadval), ko'rsatkichlar (jami, yakunlangan,
bekor qilingan, kelmagan, oldinda), uchrashuvlar jadvali, ikkita amal:

- **Uzaytirish** — necha hafta (1–12) va `onConflict`. Jami 12 haftadan
  oshsa server `SERIES_TOO_LONG` qaytaradi.
- **Butun seriyani bekor qilish** — sabab majburiy. Faqat
  `booking.series.cancel` ruxsati bilan (administratorga yopiq).
  Faqat kelajakdagi bronlar bekor qilinadi — buni oynada ochiq aytamiz.

Bitta uchrashuvni bekor qilish — oddiy bron kartochkasidan.

---

## 8. Umumiy qoidalar

Oldingi bosqichlardagilar kuchda qoladi:

- **Pul — satr** (BR-13). `Number` ga o'girilmaydi, `formatMoney`
  bilan ko'rsatiladi, `BigInt` bilan qo'shiladi.
- **Vaqt.** `startsAt`/`endsAt` — ISO UTC. Kun chegarasi **serverdan**
  (`from`/`to`). Ko'rsatishda Toshkent (`TASHKENT`).
- **Telefon** — `PhoneInput` va `displayPhone` (maska
  `+998 (90) 000-00-00`).
- **Rol solishtirilmaydi** (TZ 4.4) — faqat `useCan(...)`.
- **Xato matni serverdan** — `errorMessage(e)`, maydonga tegishlisi
  `applyServerErrors` bilan formaga tushadi.

### Xato kodlari va ularning ko'rinishi

| Kod                             | Interfeys nima qiladi                               |
| ------------------------------- | --------------------------------------------------- |
| `BOOKING_CONFLICT` (409)        | Oyna ichida: «Bu vaqt band» + kalendarni yangilaydi |
| `BOOKING_SLOT_INVALID` (400)    | Vaqt maydoni ostida                                 |
| `BOOKING_OUTSIDE_HOURS` (403)   | Oyna tepasida (administratorda uchraydi)            |
| `BOOKING_PAST_FORBIDDEN` (403)  | Oyna tepasida                                       |
| `BOOKING_VENUE_CLOSED` (409)    | Oyna tepasida                                       |
| `PRICE_BASE_RULE_MISSING` (409) | Oyna tepasida + stadion narxlariga havola           |
| `BOOKING_PRICE_CHANGED` (409)   | Eski/yangi narx bilan tasdiq oynasi                 |
| `BOOKING_NOT_FINISHED` (409)    | Umuman uchramaydi: tugma vaqtidan oldin chiqmaydi   |
| `SERIES_HAS_CONFLICTS` (409)    | Band sanalar ro'yxati ko'rsatiladi                  |
| `SERIES_TOO_LONG` (400)         | Uzaytirish oynasida                                 |

---

## 9. Fayl tuzilishi

```
src/features/bookings/
  api.ts                 kengaytiriladi: create, move, cancel, result, card
  hooks.ts               kengaytiriladi: mutatsiyalar va kalendar
  slots.ts               ko'chiriladi (venues/detail dan)
  slots.test.ts          ko'chiriladi
  BookingsPage.tsx       uchta tab
  BookingDrawer.tsx      kartochka va amallar
  BookingFormModal.tsx   tez bron
  MoveBookingModal.tsx   ko'chirish va narx tasdig'i
  CancelBookingModal.tsx sabab
  BookingsTable.tsx      ro'yxat tabi
  calendar/
    grid.ts              sof funksiyalar: o'q, bloklar
    grid.test.ts
    DayCalendar.tsx      panjara
    VenueColumn.tsx      bitta ustun
    CalendarToolbar.tsx  sana va stadion filtri

src/features/customers/
  api.ts  hooks.ts
  CustomersPage.tsx  CustomerDetailPage.tsx
  CustomerFormModal.tsx

src/features/series/
  api.ts  hooks.ts
  SeriesTab.tsx  SeriesFormModal.tsx  SeriesDetailPage.tsx
```

Har fayl bitta ish qiladi: panjara chizadi, oyna ko'rsatadi yoki
so'rov yuboradi. Hisob-kitob — `grid.ts` va `slots.ts` da, ular
interfeyssiz testlanadi.

---

## 10. Test

Har modul uchun MSW bilan integratsiya testlari:

**M6:** panjara chiziladi va bron bloki bitta bo'ladi; bo'sh katak
bosilganda oyna ochiladi va stadion/vaqt to'ldirilgan; `lookup` topgan
mijoz ko'rinadi; yaratishda `POST /bookings` to'g'ri tana bilan ketadi;
`BOOKING_CONFLICT` oynada ko'rinadi; ko'chirishda
`BOOKING_PRICE_CHANGED` tasdiq oynasini ochadi va ikkinchi so'rov
`confirmPriceChange: true` bilan ketadi; bekor qilishda sabab
majburiy; natija tugmasi o'yin tugamaguncha ko'rinmaydi.

**M5:** ro'yxat va qidiruv; qora ro'yxatga olish ruxsatsiz rolda
ko'rinmaydi; to'lov ko'rsatkichlari o'rniga izoh turadi.

**M7:** preview jadvali holatlar bilan; `ABORT` tanlanganda
`SERIES_HAS_CONFLICTS` band sanalarni ko'rsatadi; uzaytirish
`weeks` yuboradi; butun seriyani bekor qilish ruxsatsiz rolda
ko'rinmaydi.

**Sof funksiyalar:** `grid.ts` — yarim tundan o'tuvchi ish vaqti, bir
necha stadion, har xil `slotMinutes`, bloklarning joylashuvi.

---

## 11. Bu bosqichda QILINMAYDI

- **Sudrab ko'chirish** — panjara tayyor bo'lgach qo'shiladi
- **Haftalik kalendar** — backendda bor (`calendar/week`), lekin kunlik
  ko'rinish kundalik ish uchun yetarli
- **To'lov va qarz** (M8) — backendda ham yo'q
- **Narxni oldindan ko'rsatish** — kalkulyator bor, lekin tez bron
  oqimiga qadam qo'shadi
- **Bildirishnomalar** — o'qish endpointi hali yozilmagan
