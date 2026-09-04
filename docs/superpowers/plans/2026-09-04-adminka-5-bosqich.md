# Adminka 5-bosqich: audit jurnali (M11) — reja

**Spec:** [2026-09-04-adminka-5-bosqich-design.md](../specs/2026-09-04-adminka-5-bosqich-design.md)

## Umumiy cheklovlar

- Rolni solishtirish taqiqlangan (TZ 4.4) — qaror faqat `useCan()` orqali.
- Tarjima backenddan keladi, adminka o'z lug'atini yuritmaydi.
- Har task oxirida: `npm run lint && npx vitest run && npm run build`.

---

### Task 1: blob yuklashni umumiy joyga chiqarish

**Fayllar:** `src/shared/api/download.ts` (yangi),
`src/features/reports/api.ts` (o'zgaradi).

- [ ] `downloadBlob(response, fallbackName)` — `Content-Disposition` dan
      nom oladi, `URL.revokeObjectURL` ni `finally` da chaqiradi
- [ ] `reports/api.ts` shuni ishlatadi, o'zining nusxasi o'chadi
- [ ] `npx vitest run reports` — yashil
- [ ] Commit: `refactor: fayl yuklash umumiy joyga ko'chdi`

### Task 2: API va hooklar

**Fayllar:** `src/features/audit/api.ts`, `src/features/audit/hooks.ts`.

- [ ] Tiplar: `AuditChange`, `AuditEntry`, `AuditFilters`, `AuditMeta`
- [ ] `auditApi.list`, `auditApi.meta`, `auditApi.downloadCsv`
- [ ] `useAuditLog(filters)`, `useAuditMeta()` — `keepPreviousData` bilan
- [ ] Commit: `feat: audit jurnali API si va hooklari`

### Task 3: obyekt havolasi — sof funksiya

**Fayllar:** `src/features/audit/entity-link.ts`,
`src/features/audit/entity-link.test.ts`.

- [ ] Test: `venue` → `/venues/:id`, `venue_hours` → `/venues/:id`
- [ ] Test: `org_member` → `/members`, `booking_series` → `/bookings/series/:id`
- [ ] Test: `booking` va `payment` → `null` (adminkada o'z manzili yo'q)
- [ ] Test: `entityId` yo'q bo'lsa → `null`
- [ ] Commit: `feat: audit yozuvidan obyektga havola`

### Task 4: sahifa

**Fayllar:** `src/features/audit/AuditFilters.tsx`,
`src/features/audit/ChangesTable.tsx`, `src/features/audit/AuditPage.tsx`,
`src/app/router.tsx`, `src/app/layout/nav.ts`.

- [ ] Filtrlar: oraliq, xodim (`useMembers`), amal, obyekt turi, CSV
- [ ] Jadval: Sana, Xodim, Amal, Obyekt, IP; kengaytirilgan qatorda
      o'zgarishlar; `scroll={{ x: 'max-content' }}`
- [ ] O'zgarishsiz yozuvda kengaytirish tugmasi yo'q
- [ ] Marshrut `RequirePermission permission="audit.view"` ichida
- [ ] Menyu bandi: `audit.view`, `requiresOrg: true`
- [ ] Commit: `feat: audit jurnali sahifasi`

### Task 5: testlar va hujjat

**Fayllar:** `src/features/audit/audit.test.tsx`, `README.md`.

- [ ] Spec §4 dagi to'qqizta test
- [ ] `README.md` ga "Audit jurnali" bo'limi
- [ ] To'liq tekshiruv: lint, `vitest run --no-file-parallelism`, build
- [ ] Commit: `docs: adminka audit jurnali hujjatlashtirildi`
