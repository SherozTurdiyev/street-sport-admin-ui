# Adminka 5-bosqich: audit jurnali (M11)

**Sana:** 04.09.2026
**Oldingi bosqich:** [4-bosqich — hisobotlar](2026-09-04-adminka-4-bosqich-design.md)
**Backend spec:** `street-sport-back-api/docs/superpowers/specs/2026-09-04-backend-7-bosqich-design.md`

---

## 1. Nima uchun

Backendda `GET /audit-log` ishlaydi, adminkada esa uni ochadigan joy
yo'q. Direktorning `audit.view` ruxsati bor, lekin menyuda mos bo'lim
yo'q — ya'ni tizim "kim nima qildi" degan savolga javob bera oladi,
lekin bu javobni hech kim ko'rmaydi.

## 2. Tasdiqlangan qarorlar

### 2.1. Bitta sahifa `/audit`, tab'siz

Hisobotlar yettita tabga bo'lingan edi, chunki ular yettita **turli**
jadval. Jurnal esa bitta jadval, uning ustida filtrlar turadi.

### 2.2. Tarjima backenddan olinadi

`actionLabel`, `entityLabel` va `changes[].label` javobda tayyor
keladi. Adminka **o'z lug'atini yuritmaydi** — aks holda CSV va ekran
bir-biridan uzoqlashardi. Filtr ro'yxati ham `GET /audit-log/meta` dan
o'qiladi.

### 2.3. O'zgarishlar — kengaytiriladigan qatorda

Jadvalda har bir amal bitta qator. O'zgarishlar qatorni bosganda
ochiladi va uch ustunli kichik jadval bo'lib chiqadi: **Maydon, Eski,
Yangi**.

Nega asosiy jadvalga sig'dirilmadi: bitta amal beshta maydonni
o'zgartirishi mumkin, ular asosiy jadvalda qator balandligini
o'nlab piksel qilib yuborardi va "bugun nechta amal bo'ldi" degan
savolga ko'z bilan javob berib bo'lmasdi.

O'zgarishsiz yozuvda (masalan `auth.sessions_revoked`) qator
kengaymaydi — bo'sh panel ochilishi "ma'lumot yo'qoldi" degan
taassurot qoldirardi.

### 2.4. Obyektga havola — turi bo'yicha

Backend obyekt NOMINI bermaydi (12 xil jadvalga so'rov kerak bo'lardi).
Adminka `entityType` ga qarab havola quradi:

| `entityType` | Havola |
|---|---|
| `venue`, `venue_hours`, `venue_closure`, `venue_photo` | `/venues/:id` |
| `org_member`, `user` | `/members` |
| `booking_series` | `/bookings/series/:id` |
| qolganlari | havolasiz, identifikator ko'chiriladigan matn sifatida |

`booking` va `payment` uchun havola YO'Q: adminkada bitta bronning
o'z manzili yo'q, u kalendar ichidagi oynada ochiladi. Ishlamaydigan
havola berishdan ko'ra, identifikatorni nusxalash tugmasi foydaliroq.

### 2.5. Filtrlar URL da

Hisobotlardagi qoida takrorlanadi: `?from=&to=&actorId=&action=&entityType=`
URL da yashaydi. Direktor topgan izni hamkasbiga havola qilib yubora
oladi.

Sahifa raqami ham URL da — "uchinchi sahifadagi yozuvni qara" deyish
mumkin bo'lsin.

### 2.6. Xodim filtri xodimlar ro'yxatidan

`actorId` uchun tanlagich `GET /members` dan to'ladi. Jurnalni faqat
direktor ko'radi, direktorda esa `member.admin.manage` bor — ya'ni
qo'shimcha ruxsat muammosi yo'q.

Ro'yxatda **bloklangan xodimlar ham** bo'ladi: ular ketgan bo'lsa ham,
tarixdagi amallari qoladi va aynan ular qidiriladi.

## 3. Fayl tuzilmasi

| Fayl | Vazifasi |
|---|---|
| `src/shared/api/download.ts` | blob → fayl (hisobotlardan **ko'chiriladi**) |
| `src/features/audit/api.ts` | tiplar, `list`, `meta`, `downloadCsv` |
| `src/features/audit/hooks.ts` | `useAuditLog`, `useAuditMeta` |
| `src/features/audit/AuditFilters.tsx` | oraliq, xodim, amal, obyekt, CSV |
| `src/features/audit/ChangesTable.tsx` | kengaytirilgan qatordagi jadval |
| `src/features/audit/entity-link.ts` | `entityType` → manzil (sof funksiya) |
| `src/features/audit/AuditPage.tsx` | sahifa |
| `src/app/layout/nav.ts`, `src/app/router.tsx` | menyu va marshrut |

## 4. Testlar (`audit.test.tsx`)

1. Direktor jurnalni ko'radi: sana, xodim, amal nomi
2. `audit.view` yo'q rolda menyuda "Audit jurnali" yo'q
3. Qatorni ochganda o'zgarishlar jadvali chiqadi
4. O'zgarishsiz yozuvda kengaytirish tugmasi yo'q
5. Amal filtri URL ga yoziladi va so'rovga tushadi
6. Xodim filtri `GET /members` dan to'ladi
7. `export.data` yo'q bo'lsa CSV tugmasi chizilmaydi
8. Tizim yozgan amal "Tizim" deb ko'rsatiladi
9. Stadion yozuvida `/venues/:id` havolasi bor, bronda havola yo'q

## 5. Nima qilinmaydi

- Jonli yangilanish (polling/websocket) — jurnal tarix, real vaqt emas
- Obyekt nomini yechish — backend bermaydi (backend spec §3.7)
- Diagramma va statistika — bu hisobotlar bo'limining ishi
