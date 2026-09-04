# Adminka 4-bosqich rejasi — hisobotlar (M10)

> **Agent uchun:** har task oxirida `npm run lint`, `npx vitest run
> --no-file-parallelism` va `npm run build` yashil bo'lishi shart.

**Spec:** `docs/superpowers/specs/2026-09-04-adminka-4-bosqich-design.md`

**Maqsad:** backendda tayyor turgan yettita hisobotni adminkaga
chiqarish va boshqaruv panelini `/reports/summary` ga ulash.

**Arxitektura:** bitta `/reports` sahifasi, ichida ruxsatga qarab
chiziladigan tab'lar. Har bir tab o'z ma'lumotini o'zi so'raydi
(`enabled`), oraliq esa URL da saqlanadi. Diagramma kutubxonasi yo'q —
ulushlar `Progress` va `div` ustunchalari bilan.

## Umumiy cheklovlar

- **BR-13** — pul string; `Number(...)` taqiqlanadi, `formatMoney` ishlatiladi.
- **TZ 4.4** — rol solishtirilmaydi; qaror faqat `useCan(...)` orqali.
- **Ishlamaydigan tugma yo'q** — CSV tugmasi `export.data` siz chizilmaydi.
- **Bo'sh holat aytiladi** — nol qatorli jadval o'rniga "ma'lumot yo'q".
- **Mobil** — jadval `overflow-x`, kartochkalar bir ustunga tushadi.

---

## Task 1: API va hooklar

**Fayllar:** yaratish — `src/features/reports/api.ts`, `hooks.ts`

**Interfeys — keyingi tasklar shularga tayanadi:**

```ts
export type ReportRange = { from?: string; to?: string; venueIds?: string[] };

export type RevenueBlock = {
  revenue: string; previous: string; growthPercent: number | null;
};
export type Summary = { today: RevenueBlock; week: RevenueBlock; month: RevenueBlock };

export type VenueRevenue = {
  venueId: string; venueName: string; revenue: string; sharePercent: number;
};
export type MethodRevenue = {
  method: 'CASH' | 'CARD' | 'TRANSFER'; amount: string; sharePercent: number;
};
export type RangedReport<T> = { from: string; to: string; total: string; items: T[] };

export type OccupancyStat = {
  openHours: number; bookedHours: number; occupancyPercent: number;
};
export type Occupancy = {
  from: string; to: string;
  totals: OccupancyStat;
  byVenue: ({ venueId: string; venueName: string } & OccupancyStat)[];
  byHour: ({ hour: number } & OccupancyStat)[];
};

export type Cancellations = {
  from: string; to: string;
  totals: { bookings: number; cancelled: number; noShow: number; cancelRatePercent: number };
  byReason: { reason: string; count: number }[];
  byVenue: { venueId: string; venueName: string; cancelled: number; noShow: number }[];
  byStaff: { userId: string; userName: string; cancelled: number }[];
};

export type Debtors = {
  totals: {
    total: string; upTo7Days: string; from7To30Days: string;
    over30Days: string; bookingCount: number;
  };
  items: {
    customerId: string | null; customerName: string | null; phone: string | null;
    debt: string; bookingCount: number; oldestDebtDays: number;
  }[];
  total: number; page: number; pageSize: number;
};

export type StaffRow = {
  userId: string; userName: string;
  bookingsCreated: number; bookingsCancelled: number;
  paymentsReceived: string; refundsIssued: string;
  shiftsClosed: number; cashDifference: string;
};

export type ReportName =
  | 'summary' | 'revenue-by-venue' | 'revenue-by-method'
  | 'occupancy' | 'cancellations' | 'debtors' | 'staff';

export const reportsApi = {
  summary, revenueByVenue, revenueByMethod, occupancy,
  cancellations, debtors, staff,
  downloadCsv(name: ReportName, range: ReportRange): Promise<void>,
};
```

**Qadamlar:**

- [x] `api.ts` — turlar va chaqiruvlar. Yo'llar: `/reports/summary`,
      `/reports/revenue/by-venue`, `/reports/revenue/by-method`,
      `/reports/occupancy`, `/reports/cancellations`, `/reports/debtors`,
      `/reports/staff`.
- [x] `downloadCsv` — `api.get(url, { params: { ...range, format: 'csv' },
      responseType: 'blob' })`, fayl nomi `Content-Disposition` dan,
      bo'lmasa `hisobot-<name>.csv`. Yuklash `URL.createObjectURL` +
      vaqtinchalik `<a download>`; oxirida `URL.revokeObjectURL`.
- [x] `hooks.ts` — `reportKeys` va yettita hook, har birida
      `enabled: boolean` argumenti (yopiq tab so'rov yubormasin).
- [x] Commit: `feat: hisobot API si va hooklari`

---

## Task 2: Sahifa skeleti — marshrut, menyu, oraliq

**Fayllar:** yaratish — `ReportsPage.tsx`, `RangeToolbar.tsx`;
o'zgartirish — `src/app/router.tsx`, `src/app/layout/nav.ts`

**Interfeys:**

```tsx
export function RangeToolbar({ range, onChange, disabled, onExport, exporting }: {
  range: { from?: string; to?: string };
  onChange: (patch: { from?: string; to?: string }) => void;
  /** Oraliq olmaydigan tab'larda (`summary`, `debtors`) o'chiriladi. */
  disabled: boolean;
  onExport: (() => void) | null;   // null — `export.data` yo'q
  exporting: boolean;
}): JSX.Element;
```

**Qadamlar:**

- [x] `nav.ts` ga band: `{ path: '/reports', permission: 'report.debtors',
      label: 'Hisobotlar', icon: BarChartOutlined, requiresOrg: true }`.
      `report.debtors` tanlangan, chunki u eng keng ruxsat — uchala rolda
      ham bor, ya'ni bo'lim menyuda kimga ko'rinsa, ichida hech
      bo'lmasa bitta tab bo'ladi.
- [x] `router.tsx` — `/reports` `RequireOrg` ichida.
- [x] `ReportsPage.tsx` — tab ro'yxati ruxsat bo'yicha filtrlanadi;
      `searchParams` dan `tab`, `from`, `to` o'qiladi va yoziladi.
      Ruxsat yo'q tab URL da so'ralsa — birinchi ochiq tabga tushadi.
- [x] `RangeToolbar` — `DatePicker.RangePicker` (`aria-label="Sana
      oralig'i"`), o'ng tomonda "CSV yuklab olish" tugmasi.
      `disabled` bo'lganda tanlagich yonida sabab yoziladi.
- [x] Test: menejerda "Tushum" tabi yo'q, "Bandlik" bor;
      administratorda faqat "Qarzdorlar".
- [x] Commit: `feat: hisobotlar sahifasi va sana oralig'i`

---

## Task 3: Tushum, stadionlar va to'lov usuli tab'lari

**Fayllar:** `ShareBar.tsx`, `tabs/SummaryTab.tsx`, `tabs/VenuesTab.tsx`,
`tabs/MethodsTab.tsx`

**Interfeys:**

```tsx
/** Ulush ustunchasi — uchta tabda qayta ishlatiladi. */
export function ShareBar({ percent, tone }: {
  percent: number;
  tone?: 'normal' | 'warning';
}): JSX.Element;
```

**Qadamlar:**

- [x] `SummaryTab` — uchta kartochka (bugun/hafta/oy): summa, ostida
      "o'tgan davr: X" va o'sish belgisi. `growthPercent === null`
      bo'lsa foiz **chizilmaydi**, o'rniga "solishtirish uchun ma'lumot
      yo'q".
- [x] `VenuesTab` — jadval: stadion, tushum, ulush (`ShareBar`).
      Tepasida jami.
- [x] `MethodsTab` — uchta qator. Naqd ulushi 70% dan oshsa `tone="warning"`
      va izoh: "Naqd ulushi yuqori — kassa nazoratini kuchaytiring."
- [x] Test: nol bazada o'sish foizi chizilmasligi; naqd ogohlantirishi.
- [x] Commit: `feat: tushum hisobotlari — panel, stadion va usul kesimi`

---

## Task 4: Bandlik tabi

**Fayllar:** `tabs/OccupancyTab.tsx`

**Qadamlar:**

- [x] Uchta kartochka: ochiq soat, band soat, bandlik %.
- [x] Stadionlar jadvali — `ShareBar` bilan.
- [x] Soatlar ro'yxati: 24 qator, `08:00`, ustuncha va `40%`.
      Ochiq soati `0` bo'lgan qator bo'sh ustuncha va "yopiq" izohi
      bilan qoladi — yashirilmaydi.
- [x] Test: 24 qator chizilishi; yopiq soat "yopiq" deb belgilanishi.
- [x] Commit: `feat: bandlik hisoboti — soatlar kesimi bilan`

---

## Task 5: Bekor qilish va xodimlar tab'lari

**Fayllar:** `tabs/CancellationsTab.tsx`, `tabs/StaffTab.tsx`

**Qadamlar:**

- [x] `CancellationsTab` — to'rtta kartochka va uchta jadval (sabab,
      stadion, xodim). Sabablar `CANCEL_REASON_LABELS` orqali o'zbekcha;
      `UNKNOWN` — "Sabab yozilmagan".
- [x] Xodim jadvali ostida izoh: kelmagan holatini kim belgilagani
      saqlanmaydi.
- [x] `StaffTab` — jadval; kassa farqi manfiy bo'lsa qizil, `"0"` bo'lsa
      oddiy rangda.
- [x] Test: `UNKNOWN` sababi o'zbekcha chiqishi; manfiy farq rangi.
- [x] Commit: `feat: bekor qilish va xodimlar hisobotlari`

---

## Task 6: Qarzdorlar tabi

**Fayllar:** `tabs/DebtorsTab.tsx`

**Qadamlar:**

- [x] To'rtta kartochka: jami, ≤7 kun, 7–30 kun, 30+ kun.
- [x] Sahifalanadigan jadval; mijoz ismi `/customers/:id` ga havola.
- [x] Anonim qator: "Anonim bron", havolasiz.
- [x] 30 kundan oshgan qarz qizil.
- [x] Test: havola manzili; anonim qatorda havola yo'qligi; sahifalash.
- [x] Commit: `feat: qarzdorlar hisoboti`

---

## Task 7: Boshqaruv panelida o'sish foizi

**Fayllar:** `src/features/dashboard/OrgDashboard.tsx`

**Qadamlar:**

- [x] `report.profit.total` bor foydalanuvchiga tushum kartochkasi
      `useSummary()` dan o'qiydi: bugungi summa va o'sish belgisi.
- [x] Ruxsat yo'q bo'lsa kartochka **eski holicha** `today-panel` dan
      chiziladi — menejerga kunlik tushum baribir kerak.
- [x] Kartochkadan `/reports` ga havola.
- [x] Test: direktorda o'sish foizi ko'rinishi; menejerda so'rov
      yuborilmasligi.
- [x] Commit: `feat: panelda tushum o'sishi`

---

## Task 8: Mobil, hujjat va yakun

**Fayllar:** `README.md`, tab fayllari (moslash)

**Qadamlar:**

- [x] Jadvallar `scroll={{ x: true }}`, kartochkalar `grid-cols-1
      sm:grid-cols-2 lg:grid-cols-4`.
- [x] 390 px kenglikda gorizontal skroll yo'qligini tekshirish.
- [x] README ga "Hisobotlar" bo'limi: qaysi rol nimani ko'radi, daromad
      kassa asosida ekani, CSV `export.data` talab qilishi.
- [x] `npm run lint && npx vitest run --no-file-parallelism && npm run build`
- [x] Commit: `docs: adminka hisobotlari hujjatlashtirildi`

---

## Yakuniy tekshiruv

1. Direktor yettala tabni ko'radi, menejer ikkitasini, administrator bittasini
2. Ruxsat yo'q tab URL orqali ham ochilmaydi
3. CSV tugmasi administratorda yo'q; direktorda fayl yuklanadi
4. Oraliq URL da saqlanadi — havola boshqa odamda o'sha raqamlarni ochadi
5. `growthPercent: null` da foiz umuman chizilmaydi
6. Pul hech qayerda `Number` ga o'girilmaydi (BR-13)
7. 390 px da gorizontal skroll yo'q
