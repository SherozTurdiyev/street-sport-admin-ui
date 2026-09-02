# Adminka 3-bosqich — bron, mijoz va seriya

> **Ijrochi uchun:** tasklar ketma-ket bajariladi, har biridan keyin
> `npm test && npm run lint && npm run build` va commit. Qadamlar
> checkbox (`- [ ]`) bilan belgilanadi.

**Maqsad:** administrator kalendardan bron ochadi, mijoz bazasini
yuritadi va takrorlanuvchi o'yinlarni seriya qilib kiritadi.

**Arxitektura:** panjara o'zimizniki — `slots.ts` (mavjud, testlangan)
ustiga `grid.ts` qo'shiladi va kalendar ikki qatlam bo'lib chiziladi:
fon kataklari va bron bloklari. Seriya alohida bo'lim emas,
`/bookings` ichidagi tab. Sudrab ko'chirish yo'q — ko'chirish oyna
orqali.

**Texnologiya:** React 19, antd 6, @tanstack/react-query 5, dayjs,
Vitest + Testing Library + MSW.

**Spec:** [3-bosqich dizayni](../specs/2026-09-02-adminka-3-bosqich-design.md)

## Umumiy cheklovlar

Oldingi bosqichlardagilar kuchda qoladi:

- **Pul — SATR** (BR-13). `Number` ga o'girilmaydi; qo'shish `BigInt`
  bilan, ko'rsatish `formatMoney` bilan.
- **Vaqt:** `startsAt`/`endsAt` — ISO UTC. Kun chegarasi serverdan
  (`from`/`to`), brauzer mintaqasidan hisoblanmaydi. Ko'rsatishda
  `TASHKENT`.
- **Telefon:** kiritishda `PhoneInput`, ko'rsatishda `displayPhone`.
- **Rol solishtirilmaydi** (TZ 4.4) — faqat `useCan('...')`.
- **Xato matni serverdan:** `errorMessage(e)`, maydonga tegishlisi
  `applyServerErrors(form, e, FIELDS)`.
- MSW da almashtiruvchi handler `...baseHandlers()` dan **OLDIN**
  turadi — birinchi mos kelgani ishlaydi.
- antd ikonkasiga `aria-hidden` beriladi, aks holda u element nomiga
  qo'shilib ketadi.

---

## 1-qism: M6 — kalendar va bron

### Task 1: Bron API si va hooklari

**Fayllar:**

- O'zgartirish: `src/features/bookings/api.ts`, `hooks.ts`
- Ko'chirish: `src/features/venues/detail/slots.ts` →
  `src/features/bookings/slots.ts` (test fayli bilan birga);
  `VenueDetailPage.tsx` importi yangilanadi
- Ko'chirish: `CANCEL_REASON_LABELS` va `CancelReason`
  `src/features/venues/api.ts` dan `src/features/bookings/api.ts` ga;
  `ClosuresTab.tsx` importi yangilanadi

**Interfeys — keyingi tasklar shularga tayanadi:**

```ts
export type BookingCard = Booking & {
  venue: { id: string; name: string; sportType: SportType; slotMinutes: number };
  customer: {
    id: string; phone: string; fullName: string; isBlacklisted: boolean;
  } | null;
};

export type CreateBookingInput = {
  venueId: string;
  customerId?: string;
  startsAt: string;
  endsAt: string;
  discount?: string;
  note?: string;
};

/** `warnings` — masalan `["CUSTOMER_BLACKLISTED"]`. */
export type CreatedBooking = Booking & { warnings: string[] };

export type MoveBookingInput = {
  venueId?: string;
  startsAt?: string;
  endsAt?: string;
  confirmPriceChange?: boolean;
};

export const CANCEL_REASON_LABELS = { ... } as const;
export type CancelReason = keyof typeof CANCEL_REASON_LABELS;
export type CancelBookingInput = { reason: CancelReason; comment?: string };
export type BookingResult = 'COMPLETED' | 'NO_SHOW';

export const bookingsApi = {
  search, todayPanel, calendarDay,          // mavjud
  card: (id: string) => Promise<BookingCard>,
  create: (input: CreateBookingInput) => Promise<CreatedBooking>,
  move: (id: string, input: MoveBookingInput) => Promise<CreatedBooking>,
  cancel: (id: string, input: CancelBookingInput) => Promise<Booking>,
  setResult: (id: string, result: BookingResult) => Promise<Booking>,
};
```

Hooklar: `useBookingCard(id: string | null)`, `useDay(date, venueIds?)`
(to'liq `DayCalendar` qaytaradi — mavjud `useDayCalendar` bitta stadion
uchun qoladi), `useCreateBooking()`, `useMoveBooking(id)`,
`useCancelBooking(id)`, `useSetBookingResult(id)`. Har bir mutatsiya
muvaffaqiyatda `bookingKeys.all` ni bekor qiladi.

**Qadamlar:**

- [ ] `slots.ts` va `slots.test.ts` ni ko'chir, importlarni yangila,
      `npm test` yashil ekanini tekshir
- [ ] `CANCEL_REASON_LABELS` ni ko'chir, `ClosuresTab` importini
      yangila
- [ ] `api.ts` ga yuqoridagi turlar va metodlarni qo'sh
- [ ] `hooks.ts` ga hooklarni qo'sh
- [ ] Commit: `refactor: bron mantiqi o'z bo'limiga ko'chdi`

### Task 2: Panjaraning sof funksiyalari

**Fayllar:** yaratish `src/features/bookings/calendar/grid.ts`,
`grid.test.ts`

**Interfeys:**

```ts
export function minutesFrom(dayStart: string, iso: string): number;
export function axisRange(
  venues: CalendarVenue[],
  weekday: number,
): { start: number; end: number } | null;
export function hourTicks(range: { start: number; end: number }): number[];
export function bookingBlocks(
  venue: CalendarVenue,
  dayStart: string,
): { booking: Booking; top: number; height: number }[];
```

`axisRange` — barcha stadionlarning `openRanges()` birlashmasi: eng
erta ochilish va eng kech yopilish. Hech biri ochiq bo'lmasa `null`.
`bookingBlocks` faqat `activeBookings()` ni oladi va bloklarni
`top` (daqiqa) bo'yicha tartiblaydi.

**Testlar:**

- [ ] Ikki stadion, biri 08:00–23:00, ikkinchisi 10:00–02:00 →
      `axisRange` `{ start: 480, end: 1560 }` (yarim tundan o'tgani
      +24 soat bilan)
- [ ] Hech qaysi stadion shu kuni ochiq emas → `null`
- [ ] `hourTicks({ start: 480, end: 600 })` → `[480, 540, 600]`
- [ ] Ikki soatlik bron → **bitta** blok, `height: 120`
- [ ] Bekor qilingan bron blok bermaydi
- [ ] Commit: `feat: kalendar panjarasining hisob-kitobi`

### Task 3: Kalendar ekrani

**Fayllar:** yaratish `BookingsPage.tsx`, `calendar/DayCalendar.tsx`,
`calendar/VenueColumn.tsx`, `calendar/CalendarToolbar.tsx`;
o'zgartirish `src/app/layout/nav.ts`, `src/app/router.tsx`

**Nav:** `{ path: '/bookings', permission: null, label: 'Bronlar',
icon: CalendarOutlined, requiresOrg: true }` — `/dashboard` dan keyin.

`BookingsPage` — `?tab=calendar|list|series`, standarti `calendar`
(`OrganizationDetailPage` dagi `isTab` uslubida).

`CalendarToolbar`: «Kecha / Bugun / Ertaga» tugmalari, `DatePicker`,
stadionlar uchun ko'p tanlovli `Select`. Boshlang'ich sana —
`dayjs().tz(TASHKENT).format('YYYY-MM-DD')`.

`VenueColumn`: fon kataklari (`buildSlots` dan, `booking !== null`
bo'lganlari tashlanadi) + `bookingBlocks` bloklari. Blok balandligi
`height * PX_PER_MIN`, `PX_PER_MIN = 1.1`. Bo'sh katak `<button>` —
`aria-label`: `` `${venue.name} ${slot.label} — bron qilish` ``. Blok
ham `<button>`: `` `${slot vaqti} ${mijoz yoki 'Anonim'} — ochish` ``.

**Testlar:**

- [ ] Kalendar ustunlari stadion nomlari bilan chiziladi
- [ ] Ikki soatlik bron bitta blok bo'lib ko'rinadi (bitta tugma)
- [ ] «Ertaga» bosilsa so'rovdagi `date` bir kunga siljiydi
- [ ] Stadion filtri `venueIds` ni so'rovga qo'shadi
- [ ] Hech qaysi stadion ochiq bo'lmasa «Bu kuni hamma stadion yopiq»
- [ ] Commit: `feat: kunlik kalendar panjarasi`

### Task 4: Tez bron oynasi

**Fayllar:** yaratish `BookingFormModal.tsx`,
`src/features/customers/api.ts` (faqat `lookup`), `hooks.ts`

**Interfeys:**

```ts
export type Customer = {
  id: string; phone: string; fullName: string; note: string | null;
  tags: string[]; isBlacklisted: boolean; createdAt: string;
};
export type LookupResult = { created: boolean; customer: Customer };
customersApi.lookup: (input: { phone: string; fullName?: string }) => Promise<LookupResult>;
```

Oyna `venueId`, `startsAt`, `slotMinutes` ni katakdan oladi.
Maydonlar: davomiylik (1×/2×/3× slot), telefon (`PhoneInput`), ism
(faqat mijoz topilmaganda ko'rinadi), chegirma (`MoneyInput`), izoh.
Telefon bo'sh bo'lsa `customerId` yuborilmaydi — anonim bron.

Muvaffaqiyatda: oyna yopiladi, `message.success('Bron yaratildi')`,
`warnings` ichida `CUSTOMER_BLACKLISTED` bo'lsa
`message.warning('Mijoz qora ro‘yxatda')`.

**Testlar:**

- [ ] Bo'sh katak bosilsa oyna ochiladi va vaqt to'ldirilgan
- [ ] Telefon kiritilib «Topish» bosilsa topilgan mijoz ismi chiqadi
- [ ] Yangi telefon → ism maydoni ochiladi va `lookup` ikkalasini
      yuboradi
- [ ] Saqlashda `POST /bookings` tanasi to'g'ri: `venueId`, `startsAt`,
      `endsAt`, `customerId`
- [ ] `BOOKING_CONFLICT` oyna ichida ko'rsatiladi
- [ ] Qora ro'yxatdagi mijozda ogohlantirish chiqadi, bron esa
      yaratiladi
- [ ] Commit: `feat: kalendardan tez bron`

### Task 5: Bron kartochkasi va o'yin natijasi

**Fayllar:** yaratish `BookingDrawer.tsx`

Kartochka `?booking=<id>` bilan ochiladi (`useSearchParams`).
Ichida: stadion, vaqt, mijoz (`/customers/:id` ga havola), narx,
chegirma, holat, izoh, seriya bo'lsa `/bookings/series/:id` ga havola.

Amallar: «Ko'chirish», «Bekor qilish» (holat `CANCELLED` bo'lmasa);
«Yakunlandi» va «Kelmadi» — faqat `dayjs(endsAt).isBefore(dayjs())` va
holat `CONFIRMED` bo'lganda.

**Testlar:**

- [ ] Blok bosilsa kartochka ochiladi va manzilda `?booking=` paydo
      bo'ladi
- [ ] Kelajakdagi bronda natija tugmalari YO'Q
- [ ] O'tgan bronda «Yakunlandi» bosilsa
      `POST /bookings/:id/result` `{ result: 'COMPLETED' }` ketadi
- [ ] Commit: `feat: bron kartochkasi va o'yin natijasi`

### Task 6: Ko'chirish va narx tasdig'i

**Fayllar:** yaratish `MoveBookingModal.tsx`

Maydonlar: stadion, sana, boshlanish vaqti, davomiylik. Yuboriladi
faqat o'zgarganlari.

`BOOKING_PRICE_CHANGED` (409) kelganda xatoning
`details.oldPrice`/`details.newPrice` si o'qiladi va tasdiq oynasi
chiqadi: «Eski narx — X, yangi narx — Y». Tasdiqlansa o'sha tana
`confirmPriceChange: true` bilan qayta yuboriladi.

`errorDetails(e)` yordamchisi `shared/api/error-handler.ts` ga
qo'shiladi (`errorCode` yonida) — javobning `details` obyektini
qaytaradi.

**Testlar:**

- [ ] Vaqt o'zgartirilsa `PATCH /bookings/:id/move` `startsAt` va
      `endsAt` bilan ketadi
- [ ] `BOOKING_PRICE_CHANGED` da ikkala narx ko'rinadi va tasdiqdan
      keyingi so'rovda `confirmPriceChange: true` bo'ladi
- [ ] Commit: `feat: bronni ko'chirish va narx tasdig'i`

### Task 7: Bekor qilish

**Fayllar:** yaratish `CancelBookingModal.tsx`

Sabab — `CANCEL_REASON_LABELS` dan `Select`, majburiy. Izoh ixtiyoriy.
Oyna matnida: «Bekor qilingan bron tarixda qoladi, lekin vaqt bo'shaydi».

**Testlar:**

- [ ] Sababsiz saqlab bo'lmaydi — «Sababni tanlang» chiqadi
- [ ] Tana `{ reason: 'WEATHER', comment: '...' }` ko'rinishida ketadi
- [ ] Commit: `feat: bronni bekor qilish`

### Task 8: Ro'yxat tabi

**Fayllar:** yaratish `BookingsTable.tsx`

Ustunlar: sana va vaqt, stadion, mijoz, narx, holat. Filtrlar:
qidiruv, holat, stadion, sana oralig'i (`RangePicker` → `from`/`to`
ISO). Qator bosilsa `?booking=` qo'yiladi.

**Testlar:**

- [ ] Ro'yxat chiziladi va holat yorlig'i ko'rinadi
- [ ] Qidiruv `?search=` yuboradi va sahifa 1 ga qaytadi
- [ ] Qator bosilsa kartochka ochiladi
- [ ] Commit: `feat: bronlar ro'yxati`

---

## 2-qism: M5 — mijozlar

### Task 9: Mijozlar ro'yxati

**Fayllar:** o'zgartirish `src/features/customers/api.ts`, `hooks.ts`;
yaratish `CustomersPage.tsx`, `CustomerFormModal.tsx`; nav va router

**Interfeys:**

```ts
export type CustomersQuery = PageQuery & {
  search?: string;
  blacklistedOnly?: boolean;
};
export type CustomerInput = {
  fullName?: string;
  note?: string | null;
  tags?: string[];
};
(customersApi.list, create, card, update, blacklist);
```

Nav: `{ path: '/customers', permission: null, label: 'Mijozlar',
icon: UserOutlined, requiresOrg: true }` — «Bronlar» dan keyin.

Jadval: ism (havola), telefon (`displayPhone`), teglar, qora ro'yxat
belgisi. «Yangi mijoz» tugmasi — `customer.manage` ruxsati bilan.

**Testlar:**

- [ ] Ro'yxat chiziladi, telefon maskada
- [ ] Qidiruv `?search=` yuboradi
- [ ] «Faqat qora ro'yxat» `?blacklistedOnly=true` yuboradi
- [ ] Commit: `feat: mijozlar ro'yxati`

### Task 10: Mijoz sahifasi

**Fayllar:** yaratish `CustomerDetailPage.tsx`; o'zgartirish
`src/app/layout/Breadcrumbs.tsx` (`/customers/:id` uchun nom)

**Interfeys:**

```ts
export type CustomerStats = {
  totalBookings: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  lastVisitAt: string | null;
  totalPaid: string;
  currentDebt: string;
  pendingModule: 'M8';
};
export type CustomerCard = Customer & {
  stats: CustomerStats;
  bookings: Booking[];
};
```

To'rtta `StatCard`: jami bronlar, yakunlangan, bekor qilingan, oxirgi
tashrif. **`totalPaid` va `currentDebt` ko'rsatilmaydi** — ular
o'rniga izoh: «To'lov va qarz to'lovlar moduli (M8) qo'shilgach
ko'rinadi».

Tahrirlash oynasi: ism, izoh, teglar. Telefon o'zgarmaydi va sababi
yozilib qo'yiladi.

Qora ro'yxat tugmasi — `useCan('customer.blacklist')` bo'lganda.

**Testlar:**

- [ ] Statistika va bronlar tarixi ko'rinadi
- [ ] To'lov raqami emas, izoh ko'rinadi
- [ ] Administrator rolida qora ro'yxat tugmasi YO'Q
- [ ] Tahrirlash `PATCH /customers/:id` yuboradi
- [ ] Commit: `feat: mijoz sahifasi va qora ro'yxat`

---

## 3-qism: M7 — seriya

### Task 11: Seriyalar tabi

**Fayllar:** yaratish `src/features/series/api.ts`, `hooks.ts`,
`SeriesTab.tsx`; `BookingsPage` ga uchinchi tab

**Interfeys:**

```ts
export type Series = {
  id: string;
  venue: { id: string; name: string };
  customer: { id: string; phone: string; fullName: string };
  weekdays: number[];
  startTime: string;
  startDate: string;
  endDate: string;
  pricePerHour: string;
};
export type SeriesQuery = PageQuery & {
  venueId?: string;
  customerId?: string;
  expiringWithinDays?: number;
};
```

Jadval: stadion, mijoz, kunlar (`WEEKDAYS` qisqartmasi), vaqt, davr,
soatlik narx. Filtr: stadion va «7 kun ichida tugaydiganlar».

**Testlar:**

- [ ] Seriyalar jadvali chiziladi
- [ ] «Tugash arafasida» belgisi `?expiringWithinDays=7` yuboradi
- [ ] Commit: `feat: seriyalar ro'yxati`

### Task 12: Seriya yaratish

**Fayllar:** yaratish `SeriesFormModal.tsx`

**Interfeys:**

```ts
export type OccurrenceStatus = 'FREE' | 'BUSY' | 'OUTSIDE_HOURS' | 'CLOSED';
export type SeriesPreview = {
  total: number;
  free: number;
  pricePerHour: string;
  pricePerOccurrence: string;
  occurrences: { startsAt: string; endsAt: string; status: OccurrenceStatus }[];
};
export type PreviewInput = {
  venueId: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
};
export type CreateSeriesInput = PreviewInput & {
  customerId: string;
  onConflict: 'SKIP' | 'ABORT';
};
export type CreatedSeries = {
  seriesId: string;
  pricePerHour: string;
  createdCount: number;
  skipped: { startsAt: string; endsAt: string }[];
  bookings: Booking[];
};
```

Ikki qadam: forma → «Oldindan ko'rish» → sanalar jadvali (holat
yorliqlari bilan) → `SKIP`/`ABORT` tanlovi → «Yaratish». Mijoz
`lookup` orqali (tez bron oynasidagi bilan bir xil).

Oldindan ko'rilmaguncha «Yaratish» tugmasi o'chiq turadi.

**Testlar:**

- [ ] Preview jadvali holatlar bilan ko'rinadi (`Band`, `Yopiq`)
- [ ] `ABORT` da `SERIES_HAS_CONFLICTS` band sanalarni ko'rsatadi
- [ ] `SKIP` da yaratilgach `skipped` ro'yxati chiqadi
- [ ] Commit: `feat: seriya yaratish va oldindan ko'rish`

### Task 13: Seriya sahifasi

**Fayllar:** yaratish `SeriesDetailPage.tsx`; router
(`/bookings/series/:id`), `Breadcrumbs`

**Interfeys:**

```ts
export type SeriesStats = {
  totalCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  upcomingCount: number;
  paidCount: number;
  totalDebt: string;
  pendingModule: 'M8';
};
export type SeriesCard = Series & {
  durationMinutes: number;
  stats: SeriesStats;
  bookings: Booking[];
};
```

Sarlavha kartasi, to'rtta `StatCard` (jami, yakunlangan, bekor
qilingan, oldinda), uchrashuvlar jadvali. `paidCount`/`totalDebt`
ko'rsatilmaydi — mijoz sahifasidagi kabi izoh.

Amallar: «Uzaytirish» (`weeks` 1–12, `onConflict`) va «Butun seriyani
bekor qilish» — ikkinchisi `useCan('booking.series.cancel')` bilan.
Bekor qilish oynasida ochiq yoziladi: **faqat kelajakdagi bronlar**
bekor qilinadi.

**Testlar:**

- [ ] Kartochka statistikasi va uchrashuvlar ko'rinadi
- [ ] Uzaytirish `{ weeks: 2, onConflict: 'SKIP' }` yuboradi
- [ ] `SERIES_TOO_LONG` oynada ko'rinadi
- [ ] Administrator rolida «Butun seriyani bekor qilish» YO'Q
- [ ] Commit: `feat: seriya sahifasi, uzaytirish va bekor qilish`

---

## Yakuniy tekshiruv

- [ ] `npm test` — barcha testlar yashil
- [ ] `npm run lint`, `npx prettier --check`, `npm run build` toza
- [ ] To'liq ssenariy qo'lda: kalendardan bron → kartochka →
      ko'chirish → bekor qilish → mijoz sahifasi → seriya yaratish
- [ ] README dagi papka tuzilishi yangilanadi
