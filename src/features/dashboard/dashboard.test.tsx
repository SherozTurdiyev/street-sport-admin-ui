import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  ADMIN_ME,
  DIRECTOR_ME,
  SUPER_ADMIN_ME,
  authedHandlers,
} from '@/test/handlers';
import { AppRouter } from '@/app/router';

const STADION = { id: 'v-1', name: 'Chilonzor Arena' };

const PANEL = {
  date: '2026-09-02',
  nextGames: [
    {
      id: 'b-1',
      venueId: 'v-1',
      customerId: 'c-1',
      seriesId: null,
      startsAt: '2026-09-02T14:00:00.000Z',
      endsAt: '2026-09-02T15:00:00.000Z',
      priceTotal: '150000',
      discount: '0',
      status: 'CONFIRMED',
      source: 'PANEL',
      cancelReason: null,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ],
  todayRevenue: '450000',
  unpaidCount: 2,
  freeHours: 7,
  pendingModule: 'M8',
};

let bronSorovlari: URL[] = [];

function baseHandlers(me: object = DIRECTOR_ME) {
  return [
    ...authedHandlers(me),
    http.get(`${API}/bookings/today-panel`, () => HttpResponse.json(PANEL)),
    http.get(`${API}/bookings`, ({ request }) => {
      const url = new URL(request.url);
      bronSorovlari.push(url);
      // Ikki xil so'rov ketadi: bugungi kun va yaqin hafta. Ular
      // oraliqqa qarab farqlanadi.
      const total = url.searchParams.get('status') === 'CONFIRMED' ? 12 : 4;
      return HttpResponse.json({ items: [], total, page: 1, pageSize: 1 });
    }),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({
        items: [STADION],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
    ),
    http.get(`${API}/organizations/current`, () =>
      HttpResponse.json({
        id: 'o-1',
        name: 'Neon Sports Group',
        logoUrl: null,
        phone: null,
        address: null,
        timezone: 'Asia/Tashkent',
        currency: 'UZS',
        subscriptionStatus: 'ACTIVE',
        subscriptionEndsAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ),
  ];
}

beforeEach(() => {
  bronSorovlari = [];
});

describe('Boshqaruv paneli', () => {
  it('bosh sahifa aynan shu bo`limga olib boradi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/' });

    expect(
      await screen.findByRole('heading', { name: 'Boshqaruv paneli' }),
    ).toBeInTheDocument();
  });

  it('ko`rsatkichlarni va yaqin o`yinni ko`rsatadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });

    // Bugungi bronlar soni `total` dan olinadi — ro'yxat yuklanmaydi.
    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    // Pul satr sifatida kelib, satr sifatida ajratiladi (BR-13).
    expect(screen.getByText("450 000 so'm")).toBeInTheDocument();
    expect(screen.getByText('7 soat')).toBeInTheDocument();

    // Yaqin o'yin: vaqt Toshkent mintaqasida (14:00 UTC = 19:00).
    expect(await screen.findByText('19:00 – 20:00')).toBeInTheDocument();
    // Bronda faqat `venueId` bor — nom stadionlar ro'yxatidan olinadi.
    expect(screen.getByText('Chilonzor Arena')).toBeInTheDocument();
  });

  it('son uchun bitta yozuv so`raydi, yigirmatasini emas', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });

    await screen.findByText('4');
    expect(bronSorovlari.length).toBeGreaterThan(0);
    for (const url of bronSorovlari) {
      expect(url.searchParams.get('pageSize')).toBe('1');
    }
  });

  it('tushum kartochkasi faqat hisobot ruxsati bilan ko`rinadi', async () => {
    // TZ 4.3: `report.profit.*` faqat direktorda. Administratorga nol
    // ko'rsatilmaydi ham — kartochkaning o'zi chizilmaydi.
    server.use(...baseHandlers(ADMIN_ME));
    renderApp(<AppRouter />, { route: '/dashboard' });

    expect(await screen.findByText('7 soat')).toBeInTheDocument();
    expect(screen.queryByText("450 000 so'm")).not.toBeInTheDocument();
    expect(screen.queryByText('Bugungi tushum')).not.toBeInTheDocument();
  });

  it('administrator uchun ham ochiq — alohida ruxsat talab qilmaydi', async () => {
    // `VENUE_ADMIN` da `member.admin.manage` yo'q, lekin boshqaruv
    // paneli tashkilotning HAR BIR xodimiga ochiq.
    server.use(...baseHandlers(ADMIN_ME));
    renderApp(<AppRouter />, { route: '/' });

    expect(
      await screen.findByRole('heading', { name: 'Boshqaruv paneli' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Xodimlar' }),
    ).not.toBeInTheDocument();
  });
});

const TASHKILOT = {
  id: 'org-1',
  name: 'Neon Sports Group',
  logoUrl: null,
  phone: null,
  address: null,
  timezone: 'Asia/Tashkent',
  currency: 'UZS',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndsAt: null,
  blockReason: null,
  blockedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  effectiveStatus: 'ACTIVE',
  isBlocked: false,
  stats: {
    venueCount: 3,
    memberCount: 5,
    bookingCount: 120,
    lastActivityAt: null,
  },
};

describe('Platforma boshqaruv paneli', () => {
  /** Holat filtri bo'yicha turli son qaytaradi — kartochkalar shundan. */
  function platformHandlers() {
    return [
      ...authedHandlers(SUPER_ADMIN_ME),
      http.get(`${API}/platform/venues`, () =>
        HttpResponse.json({ items: [], total: 9, page: 1, pageSize: 1 }),
      ),
      http.get(`${API}/platform/organizations`, ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        const jami = { ACTIVE: 4, EXPIRED: 2, SUSPENDED: 1 };
        return HttpResponse.json({
          items: status === null ? [TASHKILOT] : [],
          total: status === null ? 7 : jami[status as keyof typeof jami],
          page: 1,
          pageSize: 5,
        });
      }),
    ];
  }

  it('tashkilot ma`lumoti o`rniga platforma holatini ko`rsatadi', async () => {
    server.use(...platformHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });

    expect(
      await screen.findByRole('heading', { name: 'Boshqaruv paneli' }),
    ).toBeInTheDocument();
    // Jami 7, faol 4, muddati tugagan 2, bloklangan 1, stadion 9.
    expect(await screen.findByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();

    const jadval = within(await screen.findByRole('table'));
    expect(jadval.getByText('Neon Sports Group')).toBeInTheDocument();
    expect(jadval.getByText('Faol')).toBeInTheDocument();
  });

  it('bugungi bron va tushumni umuman so`ramaydi (TZ 4.2)', async () => {
    // `/bookings` mock QILINMAGAN: so'rov ketsa test yiqiladi.
    server.use(...platformHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });

    await screen.findByRole('table');
    expect(screen.queryByText('Bugungi tushum')).not.toBeInTheDocument();
  });
});
