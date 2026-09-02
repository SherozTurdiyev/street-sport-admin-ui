# Adminka 1-bosqich — implementatsiya rejasi

> **Ijrochi uchun:** har bir task TDD sikli bilan. Qadamlar checkbox
> (`- [ ]`) bilan belgilanadi.

**Maqsad:** foydalanuvchi tizimga kiradi, ruxsatiga qarab menyu ko'radi
va xodimlar bo'limini to'liq boshqaradi.

**Yondashuv:** Vite + React 19 SPA. Server holati react-query da, klient
holati yo'q. Ruxsat rol bo'yicha emas, `permissions` massivi bo'yicha.

**Spec:** `docs/superpowers/specs/2026-08-28-admin-ui-1-bosqich-design.md`

## Umumiy cheklovlar

Har bir taskning talablariga quyidagilar **qo'shimcha ravishda** kiradi:

- TypeScript `strict`. `any` yozilmaydi.
- `user.role === '...'` ko'rinishidagi solishtirish **taqiqlanadi**
  (Task 8 dagi ESLint qoidasi). Qaror faqat `permissions` bo'yicha.
- Pul hech qayerda `number` ga o'girilmaydi — satrligicha qoladi.
- Xato matnlari frontendda **yozilmaydi**; backenddan kelgan `message`
  ko'rsatiladi.
- Tailwind faqat joylashuv uchun: `flex`, `grid`, `gap`, chetlar,
  kengliklar. Rang va shrift antd dan.
- Har task oxirida: `npm run lint && npm run build && npm run test`
- Har task oxirida commit.

---

## Task 1: Loyiha skeleti

**Fayllar:** butun loyiha ildizi

- [x] **1.1** Vite skeletini yaratish

Papkada `docs/` va `.git/` bor, shuning uchun Vite to'g'ridan-to'g'ri
skelet yasay olmaydi. Vaqtinchalik papkaga yasab, ko'chiriladi:

```bash
cd /tmp && rm -rf ssui && npm create vite@latest ssui -- --template react-ts
cd /Users/sheroz/Desktop/Projects/StreetSport/street-sport-admin-ui
cp -R /tmp/ssui/. .
rm -rf /tmp/ssui
```

- [x] **1.2** Paketlarni o'rnatish

```bash
npm i antd@6 @tanstack/react-query@5 axios@1 react-router@7 dayjs
npm i -D vitest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jsdom msw @vitest/coverage-v8 \
  prettier eslint-config-prettier
```

- [x] **1.3** `tsconfig.app.json` da qat'iy rejimni yoqish

```json
"strict": true,
"noUncheckedIndexedAccess": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```

`noUncheckedIndexedAccess` ataylab: `items[0]` `T | undefined` bo'ladi
va bo'sh ro'yxatdagi xato ishga tushirishdan oldin topiladi.

`vite.config.ts` ga mos `resolve.alias` qo'shiladi.

- [x] **1.4** Vitest sozlamasi — `vite.config.ts` ga

```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  globals: true,
},
```

- [x] **1.5** `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
```

- [x] **1.6** `package.json` skriptlari: `test`, `test:watch`, `format`

- [x] **1.7** Tekshirish: `npm run build` va `npm run test` (test yo'q,
      lekin ishga tushishi kerak)

- [x] **1.8** Commit: `chore: loyiha skeleti`

---

## Task 2: Tailwind va antd

**Fayllar:** `src/index.css`, `src/app/providers.tsx`, `vite.config.ts`

- [x] **2.1** Tailwind 4 o'rnatish

```bash
npm i -D tailwindcss @tailwindcss/vite
```

`vite.config.ts` ga `tailwindcss()` plagini qo'shiladi.

- [x] **2.2** `src/index.css` — **`preflight` siz**

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

`preflight.css` ataylab import qilinmaydi: u antd komponentlarining
uslublarini buzadi. Faqat `theme` (o'zgaruvchilar) va `utilities`
(sinflar) olinadi.

- [x] **2.3** `src/app/providers.tsx`

```tsx
import { ConfigProvider } from 'antd';
import uzUZ from 'antd/locale/uz_UZ';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

// 4xx qayta so'ralmaydi: 403 uch marta ham 403 qaytaradi, foydalanuvchi
// esa uch barobar kutadi.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        if (status !== undefined && status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={uzUZ}>{children}</ConfigProvider>
    </QueryClientProvider>
  );
}
```

- [x] **2.4** Tekshirish: `App.tsx` ga antd `Button` va Tailwind `flex`
      qo'yib, ikkalasi ham buzilmasdan ko'rinishini ko'rish

- [x] **2.5** Commit: `chore: antd va Tailwind, preflight o'chirilgan`

---

## Task 3: API mijozi va token xotirasi

**Fayllar:** `src/shared/api/token.ts`, `errors.ts`, `client.ts`

**Interfeys (keyingi tasklar shunga tayanadi):**

```ts
// token.ts
export function getAccessToken(): string | null;
export function setAccessToken(token: string | null): void;

// errors.ts
export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  status: number;
};
export function isApiError(e: unknown): e is ApiError;

// client.ts
export const api: AxiosInstance;
```

- [x] **3.1** Test yozish: `src/shared/api/errors.test.ts`

```ts
import { toApiError } from './errors';

it('backend xatosini o`giradi', () => {
  const e = toApiError({
    response: { status: 409, data: { code: 'PHONE_TAKEN', message: 'Band.' } },
  });
  expect(e).toEqual({
    code: 'PHONE_TAKEN', message: 'Band.', details: undefined, status: 409,
  });
});

it('tarmoq uzilganda umumiy xabar beradi', () => {
  const e = toApiError({ request: {} });
  expect(e.code).toBe('NETWORK_ERROR');
  expect(e.message).toContain('aloqa');
  expect(e.status).toBe(0);
});
```

- [x] **3.2** Testni ishlatish — yiqilishi kerak

- [x] **3.3** `token.ts` — xotiradagi o'zgaruvchi

```ts
// localStorage ATAYLAB ishlatilmaydi: unga XSS orqali yetish mumkin.
// Sahifa yangilanganda token yo'qoladi va `/auth/refresh` orqali
// tiklanadi — refresh token httpOnly cookie'da yashaydi.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
```

- [x] **3.4** `errors.ts`

```ts
export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  status: number;
};

// Frontend xato MATNINI o'ylab topmaydi: backend `message` ni o'zbek
// tilida, ko'rsatishga tayyor holda qaytaradi. Yagona istisno — javob
// umuman kelmagan holat.
export function toApiError(error: unknown): ApiError {
  const e = error as {
    response?: { status: number; data?: Partial<ApiError> };
    request?: unknown;
  };
  if (e.response) {
    const data = e.response.data ?? {};
    return {
      code: data.code ?? 'INTERNAL',
      message: data.message ?? 'Kutilmagan xatolik yuz berdi.',
      details: data.details,
      status: e.response.status,
    };
  }
  if (e.request) {
    return {
      code: 'NETWORK_ERROR',
      message: "Server bilan aloqa yo'q. Internetni tekshiring.",
      status: 0,
    };
  }
  return { code: 'INTERNAL', message: 'Kutilmagan xatolik yuz berdi.', status: 0 };
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'code' in e && 'status' in e;
}
```

- [x] **3.5** `client.ts` — interceptorsiz asos

```ts
import axios from 'axios';
import { getAccessToken } from './token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Cookie usiz `/auth/refresh` ishlamaydi.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

- [x] **3.6** `.env` va `.env.example`:
      `VITE_API_URL=http://localhost:3001/api/v1`

- [x] **3.7** Testlar o'tadi

- [x] **3.8** Commit: `feat: API mijozi va xato turi`

---

## Task 4: 401 va yagona refresh

**Fayllar:** `src/shared/api/client.ts`, `src/shared/api/client.test.ts`

Bu bosqichning eng nozik qismi. Backend refresh tokenni **har
chaqiruvda almashtiradi**. Ikkita parallel refresh ketsa, ikkinchisi
birinchisi yaratgan tokenni yaroqsiz qiladi va foydalanuvchi tizimdan
tushib ketadi. Bu xato faqat real sharoitda, tasodifiy chiqadi.

- [x] **4.1** Test: MSW bilan

```ts
it('401 dan keyin refresh qilib so`rovni qaytadan yuboradi', async () => {
  let calls = 0;
  server.use(
    http.get('*/members', () => {
      calls += 1;
      if (calls === 1) return HttpResponse.json({ code: 'AUTH_TOKEN_EXPIRED' }, { status: 401 });
      return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 });
    }),
    http.post('*/auth/refresh', () => HttpResponse.json({ accessToken: 'yangi' })),
  );

  const res = await api.get('/members');
  expect(res.data.total).toBe(0);
  expect(getAccessToken()).toBe('yangi');
});

it('parallel 401 larda refresh BIR MARTA ketadi', async () => {
  let refreshCalls = 0;
  let memberCalls = 0;
  server.use(
    http.get('*/members', () => {
      memberCalls += 1;
      if (memberCalls <= 2) return HttpResponse.json({}, { status: 401 });
      return HttpResponse.json({ ok: true });
    }),
    http.post('*/auth/refresh', () => {
      refreshCalls += 1;
      return HttpResponse.json({ accessToken: 'yangi' });
    }),
  );

  await Promise.all([api.get('/members'), api.get('/members')]);
  expect(refreshCalls).toBe(1);
});
```

- [x] **4.2** Testlarni ishlatish — yiqilishi kerak

- [x] **4.3** Interceptorni yozish

```ts
let refreshing: Promise<string> | null = null;
let onAuthLost: () => void = () => {};

export function setAuthLostHandler(fn: () => void): void {
  onAuthLost = fn;
}

// Davom etayotgan refresh hamma uchun UMUMIY. Har bir 401 o'zi
// refresh qilsa, token rotatsiyasi tufayli oxirgisidan boshqasi
// yaroqsiz bo'lardi.
function refreshOnce(): Promise<string> {
  if (!refreshing) {
    refreshing = axios
      .post<{ accessToken: string }>(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((r) => {
        setAccessToken(r.data.accessToken);
        return r.data.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

const NO_RETRY = ['/auth/login', '/auth/refresh'];

api.interceptors.response.use(
  (r) => r,
  async (error: unknown) => {
    const err = error as {
      config?: { url?: string; _retried?: boolean };
      response?: { status: number };
    };
    const config = err.config;
    const isAuthCall = NO_RETRY.some((p) => config?.url?.includes(p));

    // `_retried` cheksiz halqadan himoya: yangi token bilan ham 401
    // kelsa, ikkinchi marta urinilmaydi.
    if (err.response?.status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true;
      try {
        await refreshOnce();
        return api.request(config);
      } catch {
        setAccessToken(null);
        onAuthLost();
      }
    }
    return Promise.reject(toApiError(error));
  },
);
```

- [x] **4.4** Testlar o'tadi

- [x] **4.5** Commit: `feat: 401 da yagona refresh`

---

## Task 5: Auth bo'limi

**Fayllar:** `src/features/auth/api.ts`, `hooks.ts`, `AuthProvider.tsx`

**Interfeys:**

```ts
export type Me = {
  userId: string;
  orgId: string | null;
  role: string;
  fullName: string;
  phone: string;
  mustChangePassword: boolean;
  permissions: string[];
};
export function useAuth(): {
  me: Me | null;
  status: 'loading' | 'authed' | 'anon';
  login(phone: string, password: string): Promise<void>;
  logout(): Promise<void>;
};
export function useCan(): (permission: string) => boolean;
```

- [x] **5.1** `api.ts` — so'rovlar va tiplar

```ts
export type LoginResponse = {
  accessToken: string;
  user: {
    id: string; fullName: string; phone: string;
    orgId: string | null; role: string; mustChangePassword: boolean;
  };
};

export const authApi = {
  login: (phone: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { phone, password }).then((r) => r.data),
  me: () => api.get<Me>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then(() => undefined),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then(() => undefined),
};
```

- [x] **5.2** `AuthProvider.tsx`

Ilova ishga tushganda `refreshOnce()` chaqiriladi, keyin `me()`.
Uchinchi holat kerak: `loading` — hali bilinmaydi. Aks holda login
sahifasi bir lahza chaqnab, keyin ichki sahifaga o'tardi.

- [x] **5.3** Test: refresh muvaffaqiyatli bo'lsa `authed`, xato bo'lsa
      `anon`; `loading` paytida hech qanday sahifa render qilinmaydi

- [x] **5.4** Commit: `feat: auth konteksti`

---

## Task 6: Login sahifasi

**Fayllar:** `src/features/auth/LoginPage.tsx`

- [x] **6.1** Test

```ts
it('xato parolda backend xabarini ko`rsatadi', async () => {
  server.use(http.post('*/auth/login', () =>
    HttpResponse.json(
      { code: 'AUTH_INVALID_CREDENTIALS', message: "Telefon raqami yoki parol noto'g'ri." },
      { status: 401 },
    )));
  render(<LoginPage />, { wrapper: Providers });
  await user.type(screen.getByLabelText('Telefon'), '+998901110001');
  await user.type(screen.getByLabelText('Parol'), 'xato');
  await user.click(screen.getByRole('button', { name: 'Kirish' }));
  expect(await screen.findByText(/parol noto'g'ri/i)).toBeInTheDocument();
});
```

- [x] **6.2** antd `Form` bilan sahifani yozish. Klientda faqat
      majburiylik tekshiriladi; qolgani serverda.

- [x] **6.3** Testlar o'tadi

- [x] **6.4** Commit: `feat: login sahifasi`

---

## Task 7: Parol almashtirish

**Fayllar:** `src/features/auth/ChangePasswordPage.tsx`

- [x] **7.1** Test: `mustChangePassword: true` bo'lgan foydalanuvchi
      `/members` ga o'tolmaydi va `/change-password` ga qaytariladi

- [x] **7.2** Sahifa va yo'naltirish mantiqini yozish

- [x] **7.3** Parol almashgach backend barcha sessiyalarni yopadi —
      foydalanuvchi qayta login qilishi kerak. Buni xabarda aytish.

- [x] **7.4** Commit: `feat: parol almashtirish`

---

## Task 8: Layout, menyu va ruxsat

**Fayllar:** `src/app/layout/`, `src/app/guards/`, `eslint.config.js`

- [x] **8.1** ESLint qoidasi — rol bo'yicha solishtirishni taqiqlash

```js
{
  selector: "BinaryExpression[operator=/^[=!]==?$/] > MemberExpression[property.name='role']",
  message: "Rolni solishtirmang. Qaror `permissions` bo'yicha qabul qilinadi (TZ 4.4).",
}
```

- [x] **8.2** Test: administratorda "Xodimlar" menyusi ko'rinmaydi

- [x] **8.3** Test: `/members` ga qo'lda kirsa "ruxsat yo'q" sahifasi

- [x] **8.4** `RequireAuth`, `RequirePermission`, `AppLayout`, `Sidebar`

Menyu jadvali — marshrut, ruxsat va nom bir joyda:

```ts
export const NAV = [
  { path: '/organization', permission: null, label: 'Tashkilot' },
  { path: '/members', permission: 'member.admin.manage', label: 'Xodimlar' },
] as const;
```

- [x] **8.5** Testlar o'tadi

- [x] **8.6** Commit: `feat: layout va ruxsatli menyu`

---

## Task 9: Xatolarni ko'rsatish

**Fayllar:** `src/shared/api/error-handler.ts`, `src/app/SubscriptionBanner.tsx`

- [x] **9.1** Test: `402` kelganda banner chiqadi

- [x] **9.2** Test: `VALIDATION_FAILED` xatosi forma maydoniga tushadi

- [x] **9.3** Ishlovchini yozish

```ts
// Backend `details.message` da maydon nomlarini emas, matnlarni
// qaytaradi. Mos maydonni topib bo'lmasa, xabar umumiy joyda
// ko'rsatiladi — foydalanuvchi hech bo'lmasa nima xato ekanini biladi.
export function applyServerErrors(form: FormInstance, error: ApiError): boolean;
```

- [x] **9.4** Testlar o'tadi

- [x] **9.5** Commit: `feat: xatolarni ko'rsatish`

---

## Task 10: Xodimlar ro'yxati

**Fayllar:** `src/features/members/api.ts`, `hooks.ts`, `MembersPage.tsx`

**Interfeys:**

```ts
export type Member = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  role: 'DIRECTOR' | 'MANAGER' | 'VENUE_ADMIN';
  isActive: boolean;
  lastLoginAt: string | null;
  venueIds: string[];
};
export type Paginated<T> = {
  items: T[]; total: number; page: number; pageSize: number;
};
```

- [x] **10.1** Test: ro'yxat ko'rinadi, ikkinchi sahifaga o'tilganda
      `?page=2` so'rovi ketadi

- [x] **10.2** Test: filtr o'zgarsa sahifa 1 ga qaytadi

Filtr o'zgarganda 5-sahifada qolish — klassik xato: natija 2 ta bo'lsa,
foydalanuvchi bo'sh jadval ko'radi va sababini tushunmaydi.

- [x] **10.3** `api.ts`, `hooks.ts`, jadval

antd `Table` paginatsiyasi to'g'ridan-to'g'ri `page`/`pageSize` ga
ulanadi — nomlar backend bilan bir xil.

- [x] **10.4** `userId` va `id` farqini izohda yozish: keyingi
      so'rovlarda **`userId`** ishlatiladi.

- [x] **10.5** Testlar o'tadi

- [x] **10.6** Commit: `feat: xodimlar ro'yxati`

---

## Task 11: Xodim yaratish

**Fayllar:** `src/features/members/MemberFormModal.tsx`

- [x] **11.1** Test: yaratilgach vaqtinchalik parol ko'rinadi

```ts
expect(await screen.findByText('USNViPUQm5')).toBeInTheDocument();
```

- [x] **11.2** Test: `VENUE_ADMIN` tanlansa stadion maydoni majburiy
      bo'ladi; serverdan `MEMBER_VENUE_REQUIRED` kelsa xabar ko'rinadi

- [x] **11.3** Forma va parol oynasini yozish

Vaqtinchalik parol **bir marta** qaytadi. Oyna uni nusxalash tugmasi
bilan ko'rsatadi va yopilgach qayta ochib bo'lmaydi — buni foydalanuvchiga
aniq aytish kerak.

- [x] **11.4** Testlar o'tadi

- [x] **11.5** Commit: `feat: xodim yaratish`

---

## Task 12: Kartochka va amallar

**Fayllar:** `src/features/members/MemberCardDrawer.tsx`

- [x] **12.1** Test: rolni `VENUE_ADMIN` ga o'zgartirishda stadion
      biriktirilmagan bo'lsa `MEMBER_VENUE_REQUIRED` xabari ko'rinadi

- [x] **12.2** Test: faolsizlantirishdan oldin tasdiq so'raladi

- [x] **12.3** Kartochka: statistika, rol o'zgartirish,
      faollashtirish/faolsizlantirish, stadion biriktirish

Stadion biriktirish `PUT` — ro'yxat **butunlay almashtiriladi**.
Interfeysda bu aniq ko'rinishi kerak (checkbox ro'yxati, "qo'shish"
tugmasi emas).

- [x] **12.4** Testlar o'tadi

- [x] **12.5** Commit: `feat: xodim kartochkasi va amallari`

---

## Task 13: To'liq ssenariy va README

**Fayllar:** `src/test/scenario.test.tsx`, `README.md`

- [ ] **13.1** Ssenariy testi: login → menyu → xodim qo'shish →
      vaqtinchalik parol → rol o'zgartirish → faolsizlantirish

- [ ] **13.2** README: ishga tushirish, muhit o'zgaruvchilari, papka
      tuzilishi, qoidalar (rol tekshirilmaydi, xato matni yozilmaydi,
      pul satr)

- [ ] **13.3** Qabul mezonlarini qo'lda tekshirish (spec 13-bo'lim)

- [ ] **13.4** Commit: `test: 1-bosqichning to'liq ssenariysi va README`
