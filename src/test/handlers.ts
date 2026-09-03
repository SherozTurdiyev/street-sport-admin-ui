import { http, HttpResponse } from 'msw';

export const API = 'http://localhost:3001/api/v1';

export const DIRECTOR_ME = {
  userId: 'u-1',
  orgId: 'o-1',
  role: 'DIRECTOR',
  fullName: 'Anvar Direktorov',
  phone: '+998901110001',
  mustChangePassword: false,
  // Backenddagi DIRECTOR qatoridan: bron va mijoz ruxsatlari ham bor —
  // ular bo'lmasa interfeys tugmalarni yashirib qo'yardi.
  permissions: [
    'org.settings.update',
    'member.admin.manage',
    'member.manager.manage',
    'member.venue.assign',
    'booking.create',
    'booking.move',
    'booking.cancel',
    'booking.result.set',
    'booking.series.create',
    'booking.series.cancel',
    'customer.manage',
    'customer.blacklist',
    // TZ 4.3 da tushum hisoboti faqat direktorda — boshqaruv paneli
    // pul kartochkasini aynan shu ruxsatga qarab ko'rsatadi.
    'report.profit.total',
    'report.profit.by_venue',
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

/**
 * Platforma boshqaruv paneli (`/dashboard`) qo'shimcha so'raydigan
 * endpoint. Tashkilotlar ro'yxati testning o'zida mock qilinadi —
 * uning mazmuni har testda boshqacha.
 */
export function platformDashboardHandlers() {
  return [
    http.get(`${API}/platform/venues`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 1 }),
    ),
  ];
}

/**
 * Stadion sahifasi (`/venues/:id`) qo'shimcha so'raydigan endpointlar:
 * kunlik kalendar va bronlar soni. Panjara, bandlik va tushum shulardan
 * hisoblanadi.
 */
export function venueDayHandlers(
  venueId: string,
  venue: Partial<{
    name: string;
    slotMinutes: number;
    hours: { weekday: number; opensAt: string; closesAt: string }[];
    closures: { startsAt: string; endsAt: string; reason: string }[];
    bookings: object[];
  }> = {},
) {
  return [
    http.get(`${API}/bookings/calendar/day`, ({ request }) => {
      const url = new URL(request.url);
      const date = url.searchParams.get('date') ?? '2026-09-02';
      return HttpResponse.json({
        date,
        // Toshkent kuni UTC da 19:00 da boshlanadi.
        from: `${date}T19:00:00.000Z`,
        to: `${date}T19:00:00.000Z`,
        venues: [
          {
            venueId,
            name: venue.name ?? 'Chilonzor Arena',
            slotMinutes: venue.slotMinutes ?? 60,
            status: 'ACTIVE',
            hours: venue.hours ?? [],
            closures: venue.closures ?? [],
            bookings: venue.bookings ?? [],
          },
        ],
      });
    }),
    http.get(`${API}/bookings`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 1 }),
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
