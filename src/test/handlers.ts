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

/** Kirgan foydalanuvchi: refresh ham, `/auth/me` ham muvaffaqiyatli. */
export function authedHandlers(me: object = DIRECTOR_ME) {
  return [
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json({ accessToken: 'token' }),
    ),
    http.get(`${API}/auth/me`, () => HttpResponse.json(me)),
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
