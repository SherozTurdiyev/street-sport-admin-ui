import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

/**
 * Direktorda hisobot ruxsatlarining HAMMASI bor — jamoaviy fixture'da
 * `report.occupancy` va yangi ikkitasi yo'q, shuning uchun shu yerda
 * to'ldiriladi.
 */
const DIREKTOR = {
  ...DIRECTOR_ME,
  permissions: [
    ...DIRECTOR_ME.permissions,
    'report.occupancy',
    'report.debtors',
    'report.cancellations',
    'report.staff',
    'export.data',
  ],
};

/** Menejer: moliyaviy hisobotlarsiz, lekin operatsion hisobotlar bilan. */
const MENEJER = {
  ...DIRECTOR_ME,
  userId: 'u-2',
  role: 'MANAGER',
  fullName: 'Bobur Menejerov',
  permissions: [
    'booking.create',
    'report.occupancy',
    'report.cancellations',
    'report.debtors',
    'export.data',
  ],
};

/** Administratorda faqat qarzdorlar hisoboti va eksport ruxsati yo'q. */
const ADMINISTRATOR = {
  ...DIRECTOR_ME,
  userId: 'u-3',
  role: 'VENUE_ADMIN',
  fullName: 'Davron Adminov',
  permissions: ['booking.create', 'report.debtors'],
};

const SUMMARY = {
  today: { revenue: '150000', previous: '100000', growthPercent: 50 },
  week: { revenue: '900000', previous: '0', growthPercent: null },
  month: { revenue: '2400000', previous: '3000000', growthPercent: -20 },
};

const DEBTORS = {
  totals: {
    total: '250000',
    upTo7Days: '50000',
    from7To30Days: '0',
    over30Days: '200000',
    bookingCount: 2,
  },
  items: [
    {
      customerId: 'c-1',
      customerName: 'Alisher Rahimov',
      phone: '+998901112233',
      debt: '200000',
      bookingCount: 1,
      oldestDebtDays: 45,
    },
    {
      customerId: null,
      customerName: null,
      phone: null,
      debt: '50000',
      bookingCount: 1,
      oldestDebtDays: 3,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
};

let soralgan: URL[] = [];

function baseHandlers(me: object = DIREKTOR) {
  return [
    ...authedHandlers(me),
    http.get(`${API}/reports/summary`, ({ request }) => {
      soralgan.push(new URL(request.url));
      return HttpResponse.json(SUMMARY);
    }),
    http.get(`${API}/reports/revenue/by-venue`, ({ request }) => {
      soralgan.push(new URL(request.url));
      return HttpResponse.json({
        from: '2026-09-01',
        to: '2026-09-30',
        total: '150000',
        items: [
          {
            venueId: 'v-1',
            venueName: 'Kam Nou',
            revenue: '150000',
            sharePercent: 100,
          },
          {
            venueId: 'v-2',
            venueName: 'San Siro',
            revenue: '0',
            sharePercent: 0,
          },
        ],
      });
    }),
    http.get(`${API}/reports/revenue/by-method`, () =>
      HttpResponse.json({
        from: '2026-09-01',
        to: '2026-09-30',
        total: '100000',
        items: [
          { method: 'CASH', amount: '80000', sharePercent: 80 },
          { method: 'CARD', amount: '20000', sharePercent: 20 },
          { method: 'TRANSFER', amount: '0', sharePercent: 0 },
        ],
      }),
    ),
    http.get(`${API}/reports/occupancy`, () =>
      HttpResponse.json({
        from: '2026-09-01',
        to: '2026-09-30',
        totals: { openHours: 12, bookedHours: 3, occupancyPercent: 25 },
        byVenue: [
          {
            venueId: 'v-1',
            venueName: 'Kam Nou',
            openHours: 12,
            bookedHours: 3,
            occupancyPercent: 25,
          },
        ],
        byHour: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          openHours: hour >= 8 && hour < 20 ? 1 : 0,
          bookedHours: hour === 9 ? 1 : 0,
          occupancyPercent: hour === 9 ? 100 : 0,
        })),
      }),
    ),
    http.get(`${API}/reports/cancellations`, () =>
      HttpResponse.json({
        from: '2026-09-01',
        to: '2026-09-30',
        totals: {
          bookings: 10,
          cancelled: 2,
          noShow: 1,
          cancelRatePercent: 20,
        },
        byReason: [
          { reason: 'WEATHER', count: 1 },
          { reason: 'UNKNOWN', count: 1 },
        ],
        byVenue: [
          {
            venueId: 'v-1',
            venueName: 'Kam Nou',
            cancelled: 2,
            noShow: 1,
          },
        ],
        byStaff: [{ userId: 'u-3', userName: 'Davron Adminov', cancelled: 2 }],
      }),
    ),
    http.get(`${API}/reports/debtors`, ({ request }) => {
      soralgan.push(new URL(request.url));
      return HttpResponse.json(DEBTORS);
    }),
    http.get(`${API}/reports/staff`, () =>
      HttpResponse.json({
        from: '2026-09-01',
        to: '2026-09-30',
        items: [
          {
            userId: 'u-1',
            userName: 'Anvar Direktorov',
            bookingsCreated: 5,
            bookingsCancelled: 1,
            paymentsReceived: '500000',
            refundsIssued: '50000',
            shiftsClosed: 2,
            cashDifference: '-30000',
          },
        ],
      }),
    ),
  ];
}

beforeEach(() => {
  soralgan = [];
});

describe('Hisobotlar sahifasi', () => {
  it('direktor yettala tabni ko`radi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports' });

    expect(await screen.findByRole('tab', { name: 'Tushum' })).toBeVisible();
    for (const nom of [
      'Stadionlar',
      'To‘lov usuli',
      'Bandlik',
      'Bekor qilish',
      'Qarzdorlar',
      'Xodimlar',
    ]) {
      expect(screen.getByRole('tab', { name: nom })).toBeVisible();
    }
  });

  it('menejerda moliyaviy tab`lar yo`q', async () => {
    server.use(...baseHandlers(MENEJER));
    renderApp(<AppRouter />, { route: '/reports' });

    expect(await screen.findByRole('tab', { name: 'Bandlik' })).toBeVisible();
    expect(screen.queryByRole('tab', { name: 'Tushum' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Xodimlar' })).toBeNull();
  });

  it('administratorda faqat qarzdorlar tabi va CSV tugmasi yo`q', async () => {
    server.use(...baseHandlers(ADMINISTRATOR));
    renderApp(<AppRouter />, { route: '/reports' });

    expect(
      await screen.findByRole('tab', { name: 'Qarzdorlar' }),
    ).toBeVisible();
    expect(screen.queryByRole('tab', { name: 'Bandlik' })).toBeNull();
    // `export.data` yo'q — ishlamaydigan tugma chizilmaydi.
    expect(
      screen.queryByRole('button', { name: /CSV/i }),
    ).not.toBeInTheDocument();
  });

  it('ruxsat yo`q tab URL orqali so`ralsa, birinchi ochiq tab ochiladi', async () => {
    server.use(...baseHandlers(ADMINISTRATOR));
    renderApp(<AppRouter />, { route: '/reports?tab=staff' });

    const tab = await screen.findByRole('tab', { name: 'Qarzdorlar' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Tushum tabi', () => {
  it('uch davr va o`sish foizi ko`rinadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=summary' });

    expect(await screen.findByText("150 000 so'm")).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    expect(screen.getByText(/20%/)).toBeInTheDocument();
  });

  it('nol bazadan o`sish foizi CHIZILMAYDI', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=summary' });

    expect(
      await screen.findByText('Solishtirish uchun ma’lumot yo‘q'),
    ).toBeInTheDocument();
  });

  it('sana oralig`i o`chirilgan va sababi yozilgan', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=summary' });

    expect(
      await screen.findByText('Davrlar qat’iy: bugun, hafta va oy'),
    ).toBeInTheDocument();
  });
});

describe('Stadionlar tabi', () => {
  it('tushumsiz stadion ham qatorda qoladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=venues' });

    const jadval = within(await screen.findByRole('table'));
    expect(jadval.getByText('Kam Nou')).toBeInTheDocument();
    expect(jadval.getByText('San Siro')).toBeInTheDocument();
  });

  it('URL dagi oraliq so`rovga tushadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, {
      route: '/reports?tab=venues&from=2026-09-01&to=2026-09-30',
    });

    await screen.findByRole('table');
    const url = soralgan.find((u) => u.pathname.includes('by-venue'));
    expect(url?.searchParams.get('from')).toBe('2026-09-01');
    expect(url?.searchParams.get('to')).toBe('2026-09-30');
  });
});

describe('To`lov usuli tabi', () => {
  it('naqd ulushi yuqori bo`lsa ogohlantiradi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=methods' });

    expect(await screen.findByText('Naqd ulushi 80%')).toBeInTheDocument();
  });
});

describe('Bandlik tabi', () => {
  it('24 soat chiziladi, yopiq soat belgilanadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=occupancy' });

    expect(await screen.findByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('23:00')).toBeInTheDocument();
    // Yopiq soatlar yashirilmaydi — ular ham ma'lumot.
    expect(screen.getAllByText('yopiq').length).toBeGreaterThan(0);
  });
});

describe('Bekor qilish tabi', () => {
  it('sababsiz yozuv o`zbekcha nom oladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=cancellations' });

    expect(await screen.findByText('Ob-havo')).toBeInTheDocument();
    expect(screen.getByText('Sabab yozilmagan')).toBeInTheDocument();
  });

  it('kelmaganlar chegarasi aytiladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=cancellations' });

    expect(
      await screen.findByText(/Kelmagan holatini kim belgilaganini/),
    ).toBeInTheDocument();
  });
});

describe('Qarzdorlar tabi', () => {
  it('mijoz kartochkasiga havola, anonim qatorda havola yo`q', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=debtors' });

    const havola = await screen.findByRole('link', {
      name: 'Alisher Rahimov',
    });
    expect(havola).toHaveAttribute('href', '/customers/c-1');
    expect(screen.getByText('Anonim bron')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Anonim bron' })).toBeNull();
  });

  it('sana oralig`i so`rovga QO`SHILMAYDI — qarz joriy holat', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, {
      route: '/reports?tab=debtors&from=2026-09-01&to=2026-09-30',
    });

    await screen.findByText('Anonim bron');
    const url = soralgan.find((u) => u.pathname.includes('debtors'));
    expect(url?.searchParams.get('from')).toBeNull();
  });
});

describe('Xodimlar tabi', () => {
  it('kassa farqi ishorasi bilan chiziladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports?tab=staff' });

    const jadval = within(await screen.findByRole('table'));
    expect(jadval.getByText('Anvar Direktorov')).toBeInTheDocument();
    // "Kassa farqi" — `responsive` ustun: antd uni brekpoint
    // aniqlangandan keyin chizadi, shuning uchun kutiladi.
    expect(await jadval.findByText("-30 000 so'm")).toBeInTheDocument();
  });
});

describe('Tab almashish', () => {
  it('tanlangan tab URL da saqlanadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/reports' });

    await userEvent.click(
      await screen.findByRole('tab', { name: 'Qarzdorlar' }),
    );
    expect(await screen.findByText('Anonim bron')).toBeInTheDocument();
  });
});
