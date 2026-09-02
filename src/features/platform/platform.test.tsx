import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, SUPER_ADMIN_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const ROOT = `${API}/platform/organizations`;

const STATS = {
  venueCount: 3,
  memberCount: 5,
  bookingCount: 120,
  lastActivityAt: '2026-08-27T04:19:10.373Z',
};

/**
 * ENG MUHIM holat: ustunda `ACTIVE` turibdi, lekin obuna sanasi o'tib
 * ketgan. Interfeys `effectiveStatus` ni ko'rsatishi shart — aks holda
 * ro'yxatda "faol" ko'rinadigan, lekin yozib bo'lmaydigan tashkilot
 * paydo bo'lardi.
 */
const MUDDATI_TUGAGAN = {
  id: 'org-1',
  name: 'Neon Sports Group',
  logoUrl: null,
  phone: '+998712000000',
  address: null,
  timezone: 'Asia/Tashkent',
  currency: 'UZS',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndsAt: '2026-01-01T00:00:00.000Z',
  blockReason: null,
  blockedAt: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  effectiveStatus: 'EXPIRED',
  isBlocked: true,
  stats: STATS,
};

const STADION = {
  id: 'v-1',
  orgId: 'org-1',
  name: 'Chilonzor Arena',
  sportType: 'FOOTBALL_5X5',
  surface: 'ARTIFICIAL_GRASS',
  sizeLabel: '40x20',
  isIndoor: false,
  city: 'Toshkent',
  address: null,
  latitude: null,
  longitude: null,
  contactPhone: null,
  slotMinutes: 60,
  amenities: [],
  photos: [],
  description: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  basePricePerHour: '150000',
};

let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers() {
  return [
    ...authedHandlers(SUPER_ADMIN_ME),
    http.get(ROOT, () =>
      HttpResponse.json({
        items: [MUDDATI_TUGAGAN],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    ),
    http.get(`${ROOT}/org-1`, () =>
      HttpResponse.json({ ...MUDDATI_TUGAGAN, directors: [] }),
    ),
    http.get(`${ROOT}/org-1/members`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
    ),
    http.get(`${ROOT}/org-1/venues`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
    ),
  ];
}

/** Ro'yxatdan tashkilot sahifasiga o'tadi. */
async function tashkilotSahifasi(): Promise<HTMLElement> {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Neon Sports Group — ochish' }),
  );
  await screen.findByRole('heading', { name: 'Neon Sports Group' });
  return document.body;
}

beforeEach(() => {
  yuborilgan = [];
});

describe('Platforma paneli', () => {
  it('platforma xodimi tashkilotlar bo`limiga tushadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/' });

    expect(
      await screen.findByRole('menuitem', { name: 'Tashkilotlar' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Neon Sports Group')).toBeInTheDocument();
  });

  it('AMALDAGI holatni ko`rsatadi, bazadagi ustunni emas', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/platform/organizations' });

    const jadval = within(await screen.findByRole('table'));
    // Ustunda `ACTIVE`, amalda esa muddati tugagan.
    expect(await jadval.findByText('Muddati tugagan')).toBeInTheDocument();
    expect(jadval.queryByText('Faol')).not.toBeInTheDocument();
  });

  it('bloklashda sabab so`raydi va uni yuboradi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(`${ROOT}/org-1/block`, async ({ request }) => {
        yuborilgan.push({ url: request.url, body: await request.json() });
        return HttpResponse.json({
          ...MUDDATI_TUGAGAN,
          subscriptionStatus: 'SUSPENDED',
          effectiveStatus: 'SUSPENDED',
          blockReason: "To'lov kelmadi",
        });
      }),
    );
    renderApp(<AppRouter />, { route: '/platform/organizations' });

    await tashkilotSahifasi();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Tashkilotni bloklash' }),
    );

    // Oyna kartochka ustiga ochiladi — ro'yxatdagi oxirgi `dialog`.
    await screen.findByLabelText('Sabab');
    const oynalar = screen.getAllByRole('dialog');
    const oyna = within(oynalar[oynalar.length - 1] as HTMLElement);
    // Sababsiz yuborilmaydi.
    await userEvent.click(oyna.getByRole('button', { name: 'Bloklash' }));
    expect(yuborilgan).toEqual([]);

    await userEvent.type(oyna.getByLabelText('Sabab'), "To'lov kelmadi");
    await userEvent.click(oyna.getByRole('button', { name: 'Bloklash' }));

    expect(yuborilgan).toEqual([
      { url: `${ROOT}/org-1/block`, body: { reason: "To'lov kelmadi" } },
    ]);
  });

  it('muddati o`tgan tashkilotni blokdan chiqarish yetarli emasligini aytadi', async () => {
    server.use(
      // Almashtiruvchi handler OLDINDA: bitta `server.use` chaqiruvida
      // birinchi mos keluvchi ishlaydi.
      http.get(`${ROOT}/org-1`, () =>
        HttpResponse.json({
          ...MUDDATI_TUGAGAN,
          subscriptionStatus: 'SUSPENDED',
          effectiveStatus: 'SUSPENDED',
          blockReason: "To'lov kelmadi",
          blockedAt: '2026-02-01T00:00:00.000Z',
          directors: [],
        }),
      ),
      ...baseHandlers(),
    );
    renderApp(<AppRouter />, { route: '/platform/organizations' });

    await tashkilotSahifasi();
    // Muddat allaqachon o'tgan: blokdan chiqarish holatni ACTIVE
    // qilmaydi va foydalanuvchi buni OLDINDAN bilishi kerak.
    expect(await screen.findByText(/muddati.*o.?tgan/i)).toBeInTheDocument();
  });

  it('manzildagi bo`lim to`g`ridan-to`g`ri ochiladi', async () => {
    server.use(
      // Almashtiruvchi handler OLDINDA turishi shart.
      http.get(`${ROOT}/org-1/members`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'm-1',
              userId: 'u-1',
              fullName: 'Anvar Direktorov',
              phone: '+998901110001',
              role: 'DIRECTOR',
              isActive: true,
              lastLoginAt: null,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
      ),
      ...baseHandlers(),
    );
    renderApp(<AppRouter />, {
      route: '/platform/organizations/org-1?tab=members',
    });

    expect(await screen.findByText('Anvar Direktorov')).toBeInTheDocument();
  });

  it('stadionlar bo`limi kartochka bilan chiziladi', async () => {
    server.use(
      // Almashtiruvchi handler OLDINDA turishi shart.
      http.get(`${ROOT}/org-1/venues`, () =>
        HttpResponse.json({
          items: [STADION],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
      ),
      ...baseHandlers(),
    );
    renderApp(<AppRouter />, {
      route: '/platform/organizations/org-1?tab=venues',
    });

    expect(
      await screen.findByRole('heading', { name: 'Chilonzor Arena' }),
    ).toBeInTheDocument();
    // Kartochkadagi eng ko'rinarli qiymat — narx.
    expect(screen.getByText("150 000 so'm/soat")).toBeInTheDocument();
    // Jadval EMAS: bo'limda endi panjara bor.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // Havola platformaning o'z sahifasiga boradi: `/venues/v-1` ga
    // emas — u tashkilot ichidagi sahifa va platformaga yopiq.
    expect(
      screen.getByRole('button', { name: 'Chilonzor Arena — ochish' })
        .parentElement,
    ).toHaveAttribute('href', '/platform/venues/v-1');
  });

  it('tor ekranda jadval o`rniga kartochka chizadi', async () => {
    const asl = window.matchMedia;
    // jsdom ekran o'lchamini bilmaydi; so'rovga qarab javob beramiz.
    window.matchMedia = ((query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    try {
      server.use(...baseHandlers());
      renderApp(<AppRouter />, { route: '/platform/organizations' });

      expect(
        await screen.findByRole('heading', { name: 'Neon Sports Group' }),
      ).toBeInTheDocument();
      // Olti ustunli jadval telefon ekraniga sig'maydi.
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    } finally {
      window.matchMedia = asl;
    }
  });

  it('yangi tashkilot ochganda vaqtinchalik parolni ko`rsatadi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(ROOT, async ({ request }) => {
        yuborilgan.push({ url: request.url, body: await request.json() });
        return HttpResponse.json(
          {
            organization: { ...MUDDATI_TUGAGAN, name: 'Hujjat MCHJ' },
            director: {
              userId: 'u-9',
              fullName: 'Yangi Direktor',
              phone: '+998993517023',
            },
            temporaryPassword: 'u3usvaXZh3',
          },
          { status: 201 },
        );
      }),
    );
    renderApp(<AppRouter />, { route: '/platform/organizations' });

    await screen.findByRole('table');
    await userEvent.click(
      screen.getByRole('button', { name: /Yangi tashkilot/ }),
    );

    const oyna = within(await screen.findByRole('dialog'));
    await userEvent.type(oyna.getByLabelText('Tashkilot nomi'), 'Hujjat MCHJ');
    await userEvent.type(
      oyna.getByLabelText('Direktor ismi'),
      'Yangi Direktor',
    );
    await userEvent.type(
      oyna.getByLabelText('Direktor telefoni'),
      // Maska mamlakat kodini o'zi qo'yadi — foydalanuvchi milliy
      // raqamni teradi, serverga esa `+998993517023` ketadi.
      '993517023',
    );
    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    expect(await screen.findByText('u3usvaXZh3')).toBeInTheDocument();
    expect(yuborilgan).toEqual([
      {
        url: ROOT,
        body: {
          name: 'Hujjat MCHJ',
          director: {
            fullName: 'Yangi Direktor',
            phone: '+998993517023',
          },
        },
      },
    ]);
  });
});
