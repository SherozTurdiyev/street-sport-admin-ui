import { http, HttpResponse } from 'msw';

export const API = 'http://localhost:3001/api/v1';

export const DIRECTOR_ME = {
  userId: 'u-1',
  orgId: 'o-1',
  role: 'DIRECTOR',
  fullName: 'Anvar Direktorov',
  phone: '+998901110001',
  mustChangePassword: false,
  permissions: [
    'org.settings.update',
    'member.admin.manage',
    'member.manager.manage',
    'member.venue.assign',
  ],
};

export const ADMIN_ME = {
  userId: 'u-3',
  orgId: 'o-1',
  role: 'VENUE_ADMIN',
  fullName: 'Davron Adminov',
  phone: '+998901110003',
  mustChangePassword: false,
  // Administratorda `member.admin.manage` YO'Q — menyu testlari shunga
  // tayanadi.
  permissions: ['booking.create', 'customer.manage'],
};

/**
 * Platforma xodimi: `orgId` YO'Q va ruxsatlar ro'yxati bo'sh. Bu backend
 * qarori (TZ 4.2) — uning amallari alohida platforma endpoint'larida.
 */
export const SUPER_ADMIN_ME = {
  userId: 'u-0',
  orgId: null,
  role: 'SUPER_ADMIN',
  fullName: 'Platforma Egasi',
  phone: '+998901110000',
  mustChangePassword: false,
  // Backend `/auth/me` da aynan shu ruxsatni qaytaradi — platforma
  // ruxsatlari alohida fazoda va tashkilot rollariga berilmaydi.
  permissions: ['platform.org.manage'],
};

/** Kirgan foydalanuvchi: refresh ham, `/auth/me` ham muvaffaqiyatli. */
export function authedHandlers(me: object = DIRECTOR_ME) {
  return [
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json({ accessToken: 'token' }),
    ),
    http.get(`${API}/auth/me`, () => HttpResponse.json(me)),
  ];
}

/**
 * Bosh sahifa (`/dashboard`) so'raydigan endpointlar.
 *
 * Ular ILOVA ROOT ini (`/`) ochadigan har bir testga kerak: menyudagi
 * birinchi bo'lim endi boshqaruv paneli. Har bir testda takrorlanmasin
 * deb shu yerda.
 */
export function dashboardHandlers() {
  return [
    http.get(`${API}/bookings/today-panel`, () =>
      HttpResponse.json({
        date: '2026-09-02',
        nextGames: [],
        todayRevenue: '0',
        unpaidCount: 0,
        freeHours: 0,
        pendingModule: 'M8',
      }),
    ),
    http.get(`${API}/bookings`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 1 }),
    ),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
    ),
  ];
}

/** Kirmagan foydalanuvchi: cookie yo'q, refresh 401 qaytaradi. */
export function anonHandlers() {
  return [
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json(
        {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Sessiya yaroqsiz. Qaytadan kiring.',
        },
        { status: 401 },
      ),
    ),
  ];
}
