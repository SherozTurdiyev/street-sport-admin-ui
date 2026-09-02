# Adminka 2-bosqich — stadionlar va narxlar

**Maqsad:** stadion egasi maydonlarini kiritadi, ish vaqtini belgilaydi,
narx qoidalarini o'rnatadi va vaqtinchalik yopilishlarni qayd etadi.
Shu bosqichdan keyin stadion bron qabul qilishga tayyor bo'ladi.

**Backend:** 18 endpoint, hammasi tayyor. `docs/API.md` 8 va 9-bo'limlar.

**Ish tartibi:** uch qism, har biridan keyin ko'rib chiqish.

## Umumiy cheklovlar

1-bosqichdagilar kuchda qoladi va ularga qo'shimcha:

- Pul (`pricePerHour`) — **satr**, `Number` ga o'girilmaydi (BR-13).
- Vaqt: `opensAt`, `closesAt`, `startsTime`, `endsTime` — `HH:mm`,
  **Toshkent mahalliy vaqti**. `startsAt`/`endsAt` — ISO UTC.
- Hafta kuni — `1`–`7` butun son (dushanba = 1).
- Ro'yxatni to'liq almashtiruvchi `PUT` lar interfeysda ochiq ko'rinadi.

---

## 1-qism: stadion ishlaydigan holga keladi

### Task 1: Stadionlar ro'yxati va profili

**Fayllar:** `src/features/venues/api.ts` (kengaytiriladi), `hooks.ts`,
`VenuesPage.tsx`, `VenueFormModal.tsx`, `enums.ts`

**Interfeys:**

```ts
export type VenueStatus = 'ACTIVE' | 'TEMPORARILY_CLOSED' | 'ARCHIVED';
export type Venue = {
  id: string; name: string; sportType: SportType; surface: Surface | null;
  sizeLabel: string | null; isIndoor: boolean; city: string | null;
  address: string | null; contactPhone: string | null; slotMinutes: 30 | 60;
  amenities: Amenity[]; photos: VenuePhoto[]; description: string | null;
  status: VenueStatus; createdAt: string; updatedAt: string;
};
export type VenueDetail = Venue & { hours: VenueHours[]; closures: Closure[] };
```

- Test: ro'yxat ko'rinadi, shahar filtri `?city=` yuboradi, filtr
  o'zgarsa sahifa 1 ga qaytadi
- Test: yaratishda `slotMinutes` standart 60 ketadi
- Enum yorliqlari `enums.ts` da — bitta joyda, `ROLE_LABELS` uslubida
- Commit: `feat: stadionlar ro'yxati va profili`

### Task 2: Kartochka, arxivlash va qaytarish

**Fayllar:** `VenueCardDrawer.tsx`

- Test: faol broni bor stadionni arxivlashda `VENUE_HAS_ACTIVE_BOOKINGS`
  (409) kelsa, tasdiq so'raladi va ikkinchi urinish `confirm: true`
  bilan ketadi
- Test: arxivlangan stadionni tahrirlashda `VENUE_ARCHIVED` xabari
  ko'rinadi
- Commit: `feat: stadion kartochkasi va arxivlash`

### Task 3: Haftalik ish vaqti

**Fayllar:** `WeeklyHoursForm.tsx`

`PUT` jadvalni **to'liq almashtiradi**: ro'yxatga kirmagan kun yopiq.
Shuning uchun forma haftaning yettala kunini ko'rsatadi, har birida
"ochiq/yopiq" belgisi bilan — "kun qo'shish" tugmasi EMAS.

- Test: yettala kun ko'rinadi; belgisi olingan kun `hours` massiviga
  umuman kirmaydi
- Test: 18:00 → 02:00 saqlanadi va xato deb ko'rsatilmaydi
- Test: `VENUE_HOURS_INVALID` xabari formada chiqadi
- Commit: `feat: stadion ish vaqti`

---

## 2-qism: narx

### Task 4: Narx qoidalari

**Fayllar:** `prices/PriceRulesTab.tsx`, `PriceRuleModal.tsx`

- Test: bazaviy qoida yo'q stadionda ogohlantirish ko'rinadi
- Test: ikkinchi bazaviy qoidada `PRICE_BASE_RULE_DUPLICATE` xabari
- Test: `PRICE_RULE_CONFLICT` xabari qoida formasida chiqadi
- Test: `pricePerHour` satrligicha yuboriladi
- Commit: `feat: narx qoidalari`

### Task 5: Haftalik narx panjarasi va kalkulyator

**Fayllar:** `prices/PriceTable.tsx`, `prices/PriceCalculator.tsx`

168 katak (7×24). Katak rangi tarifga qarab, ustiga qoida nomi.

- Test: panjara 168 katak chizadi va tarif nomini ko'rsatadi
- Test: kalkulyator segmentlarni ro'yxat qilib, jamini ko'rsatadi
- Commit: `feat: narx panjarasi va kalkulyator`

---

## 3-qism: fotolar va yopilishlar

### Task 6: Fotolar

**Fayllar:** `photos/PhotosTab.tsx`

`multipart/form-data` — frontendda birinchi marta. Rasm `photos[].url`
orqali ko'rsatiladi (`/api/v1/files/:id`).

- Test: yuklashda `FormData` ketadi va ro'yxat yangilanadi
- Test: `FILE_TOO_LARGE` va `FILE_TYPE_INVALID` xabarlari ko'rinadi
- Commit: `feat: stadion fotolari`

### Task 7: Vaqtinchalik yopilishlar

**Fayllar:** `closures/ClosuresTab.tsx`

- Test: davrda bron bo'lsa `VENUE_CLOSURE_HAS_BOOKINGS` (409) kelib,
  tasdiq so'raladi; tasdiqdan keyin `cancelBookings: true` ketadi
- Test: yopilishni o'chirish bekor qilingan bronlarni tiklamasligi
  ekranda aytiladi
- Commit: `feat: vaqtinchalik yopilishlar`

---

## Tekshiruv

Har task oxirida: `npm run lint && npm run build && npm test`

Bosqich yakunida:

1. Yangi stadion ochiladi, ish vaqti va bazaviy narx qo'yiladi —
   stadion bronga tayyor holga keladi
2. Narx panjarasi qoidalar bilan mos tushadi
3. Arxivlangan stadion ro'yxatda faqat `status=ARCHIVED` filtri bilan
4. Administrator biriktirilmagan stadionni ko'rmaydi (BR-08 backendda,
   interfeys 403 xabarini ko'rsatadi)
