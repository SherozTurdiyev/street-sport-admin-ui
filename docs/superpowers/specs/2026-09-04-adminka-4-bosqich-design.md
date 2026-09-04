# Adminka 4-bosqich: hisobotlar (M10)

**Sana:** 04.09.2026
**Oldingi bosqich:** [3-bosqich — bronlar, mijozlar, seriya](2026-09-02-adminka-3-bosqich-design.md)
**Backend spec:** `street-sport-back-api/docs/superpowers/specs/2026-09-03-backend-6-bosqich-design.md`

---

## 1. Nima uchun bu bosqich

Backendda M10 tayyor: yettita endpoint ishlaydi, testlari yashil.
Adminkada esa ulardan **bittasi ham chaqirilmaydi**. Ya'ni stadion
egasi pul to'laydigan qism — "biznesim qanday ketyapti" degan savolga
javob — hali ekranda yo'q.

Hozirgi holat:

| Backend | Adminka |
|---|---|
| `GET /reports/summary` | ishlatilmaydi |
| `GET /reports/revenue/by-venue` | ishlatilmaydi |
| `GET /reports/revenue/by-method` | ishlatilmaydi |
| `GET /reports/occupancy` | ishlatilmaydi |
| `GET /reports/cancellations` | ishlatilmaydi |
| `GET /reports/debtors` | ishlatilmaydi |
| `GET /reports/staff` | ishlatilmaydi |

Boshqaruv paneli bugungi tushumni `today-panel` dan oladi va **o'sish
foizini ko'rsatmaydi** — direktor "kecha bilan solishtirganda qanday?"
degan savolga javob ololmaydi.

---

## 2. Tasdiqlangan qarorlar

04.09.2026 da tanlandi.

### 2.1. Diagramma kutubxonasi QO'SHILMAYDI

Bandlik soatlari va to'lov usullari **CSS ustunchalari** bilan
chiziladi: `antd` ning `Progress` komponenti va oddiy `div` lar.

Sabab: yagona haqiqiy diagramma kerak bo'ladigan joy — bandlikning
soat kesimi, u esa 24 ta qatordan iborat va gorizontal ustunchada
mukammal o'qiladi. ~100 KB kutubxona, uning mavzuga (dark) moslash
ishi va mobil moslashuvi bir shu ekran uchun juda qimmat. Raqamlar
baribir yonida turadi.

### 2.2. Bitta `/reports` sahifasi, ichida tab'lar

Menyuda bitta band. Ichida yettita tab, lekin foydalanuvchi **faqat
ruxsati bor tab'larni ko'radi**:

| Tab | Ruxsat | Direktor | Menejer | Administrator |
|---|---|---|---|---|
| Tushum | `report.profit.total` | ✅ | — | — |
| Stadionlar | `report.profit.by_venue` | ✅ | — | — |
| To'lov usuli | `report.profit.total` | ✅ | — | — |
| Bandlik | `report.occupancy` | ✅ | ✅ | — |
| Bekor qilish | `report.cancellations` | ✅ | ✅ | — |
| Qarzdorlar | `report.debtors` | ✅ | ✅ | ✅ |
| Xodimlar | `report.staff` | ✅ | — | — |

Administratorda faqat bitta tab qoladi — u ochilgan holda keladi.
Hech bir tab yo'q bo'lsa (bu holat faqat platforma xodimida) menyuda
bo'lim ham ko'rinmaydi.

Sana oralig'i tanlagichi **sahifa darajasida**, tab'lardan yuqorida:
bir marta tanlab, tab'lar orasida yurish mumkin. Oraliq URL da
saqlanadi (`?from=&to=&tab=`) — hisobotga havola yuborilganda
qabul qiluvchi **aynan o'sha raqamlarni** ko'rishi kerak.

### 2.3. Boshqaruv paneli `/reports/summary` ga ulanadi

Direktorning panelidagi tushum kartochkasi endi uchta raqamni
ko'rsatadi: bugun, hafta, oy — har biri o'tgan davr bilan
solishtirilgan.

`growthPercent: null` bo'lganda foiz **umuman chizilmaydi**: backend
uni noldan o'sish hisoblanmasligi uchun `null` qaytaradi, adminka
"+100%" deb to'ldirsa, o'sha yolg'on qaytib kelardi.

Panel `report.profit.total` yo'q foydalanuvchiga eski ko'rinishda
qoladi (`today-panel` dagi bugungi tushum) — menejerda moliyaviy
hisobot yo'q, lekin kunlik tushum uning ishi uchun kerak.

---

## 3. Ekranlar

### 3.1. Tushum (F10.1) — `?tab=summary`

Uchta kartochka: **Bugun**, **Hafta**, **Oy**. Har birida summa,
ostida "o'tgan davr: X" va o'sish belgisi (yashil ▲ / qizil ▼).

Sana oralig'i bu tabda **o'chirilgan** va sababi yozib qo'yiladi:
davrlar qat'iy, backend oraliqni qabul qilmaydi (400 qaytaradi).

### 3.2. Stadionlar (F10.2) — `?tab=venues`

Jadval: stadion nomi, tushum, ulush. Ulush ustuni `Progress` bilan
chiziladi — ko'z darhol "qaysi obyekt tortyapti" degan javobni oladi.
Tushumsiz stadion ham qatorda qoladi (backend uni yashirmaydi).

### 3.3. To'lov usuli (F10.3) — `?tab=methods`

Uchta qator: Naqd, Karta, O'tkazma. Har birida summa, ulush va
ustuncha. **Naqd ulushi 70% dan oshsa** ogohlantiruvchi rangda
chiziladi va yonida izoh turadi: TZ buni nazorat signali deb ataydi.

### 3.4. Bandlik (F10.4) — `?tab=occupancy`

Uch qism:

1. Umumiy: ochiq soat, band soat, bandlik foizi (kartochkalar).
2. Stadionlar jadvali — har biriga `Progress`.
3. **Soatlar ustunchasi** — 24 ta qator: `08:00 ▓▓▓▓░░ 40%`.
   Ochiq soati nol bo'lgan qatorlar bo'sh ko'rsatiladi, yashirilmaydi:
   "bu soatda stadion yopiq" ham ma'lumot.

### 3.5. Bekor qilish (F10.5) — `?tab=cancellations`

Kartochkalar: jami bron, bekor qilingan, kelmagan, bekor qilish
ulushi. Uchta jadval: sabab, stadion, xodim.

**Xodim jadvali ostida izoh:** "Kelmagan holatini kim belgilaganini
tizim saqlamaydi, shuning uchun u xodim kesimida ko'rsatilmaydi."
Backend bu ma'lumotni bermaydi va buni yashirish adminkada yanada
chalg'ituvchi bo'lardi.

### 3.6. Qarzdorlar (F10.6) — `?tab=debtors`

Yuqorida to'rtta kartochka: jami qarz va uch muddat guruhi
(≤7 kun, 7–30, 30+). Pastda sahifalanadigan jadval: mijoz, telefon,
qarz, bronlar soni, eng eski qarz (kun).

- Mijoz ismi **havola** — mijoz kartochkasiga olib boradi, u yerdan
  telefon qilish mumkin.
- 30 kundan oshgan qarz qizil rangda.
- Anonim bronlar qatorida ism o'rniga "Anonim bron" turadi va havola
  bo'lmaydi — bosadigan joyi yo'q.
- Sana oralig'i bu tabda ham **o'chirilgan**: qarz joriy holat.

### 3.7. Xodimlar (F10.7) — `?tab=staff`

Jadval: xodim, yaratgan bron, bekor qilgan, qabul qilgan pul,
qaytargan, smena soni, kassa farqi. Manfiy farq qizil, nol —
oddiy rangda.

---

## 4. CSV yuklab olish

Har bir tabda "CSV yuklab olish" tugmasi. U faqat **`export.data`**
ruxsati bor foydalanuvchiga chiziladi — administratorda bu ruxsat
yo'q va unga ishlamaydigan tugma ko'rsatishning ma'nosi yo'q.

Texnik jihat: `axios` javobni JSON deb o'qiydi, shuning uchun
so'rov `responseType: 'blob'` bilan yuboriladi va natija
`URL.createObjectURL` orqali saqlanadi. Fayl nomi backend bergan
`Content-Disposition` dan olinadi; u yo'q bo'lsa hisobot nomi va
oraliqdan yig'iladi.

**Nima uchun oddiy `<a href>` emas:** havola `Authorization`
sarlavhasini yubormaydi, ya'ni backend 401 qaytarardi. Token esa
ataylab `localStorage` da emas (XSS), demak uni URL ga qo'yib ham
bo'lmaydi.

---

## 5. Fayl tuzilmasi

```
src/features/reports/
  api.ts                 turlar va yettita chaqiruv + CSV yuklash
  hooks.ts               react-query kalitlari va hooklar
  ReportsPage.tsx        sahifa: oraliq tanlagichi va tab'lar
  RangeToolbar.tsx       sana oralig'i + CSV tugmasi
  ShareBar.tsx           ulush ustunchasi (bir qatorli, qayta ishlatiladi)
  tabs/SummaryTab.tsx
  tabs/VenuesTab.tsx
  tabs/MethodsTab.tsx
  tabs/OccupancyTab.tsx
  tabs/CancellationsTab.tsx
  tabs/DebtorsTab.tsx
  tabs/StaffTab.tsx
  reports.test.tsx       MSW bilan integratsion testlar
```

O'zgartiriladi:

```
src/app/router.tsx             + /reports
src/app/layout/nav.ts          + Hisobotlar bandi
src/features/dashboard/OrgDashboard.tsx   tushum kartochkasi
```

Har bir tab **o'z ma'lumotini o'zi so'raydi** (`enabled` bilan): ochiq
bo'lmagan tab uchun so'rov ketmaydi. Yettala hisobotni bir vaqtda
yuklash direktor sahifani ochishi bilan yettita og'ir so'rov degani
bo'lardi.

---

## 6. Chegaralar

| Qoida | Qanday bajariladi |
|---|---|
| TZ 4.4 | Rol solishtirilmaydi; tab'lar `useCan(...)` bilan tanlanadi |
| BR-13 | Pul — **string**, `Number` ga o'girilmaydi; `formatMoney` bilan chiziladi |
| Ishlamaydigan tugma yo'q | CSV tugmasi `export.data` siz chizilmaydi |
| Bo'sh holat | Har bir jadvalda "Bu davrda ma'lumot yo'q" — nol qatorli jadval emas |
| Mobil | Jadvallar `overflow-x`, kartochkalar bir ustunga tushadi |

---

## 7. Nima ataylab qilinmaydi

| Nima | Nega |
|---|---|
| Diagramma kutubxonasi | 2.1-bo'lim |
| Hisobotni PDF qilish | CSV yetarli; PDF backendda ham yo'q |
| Hisobotni jadvalda saralash | Backend tartibi ma'noli (tushum/qarz bo'yicha kamayish) |
| Avtomatik yangilanish | Hisobot — o'tmish; har soniyada o'zgarmaydi |
