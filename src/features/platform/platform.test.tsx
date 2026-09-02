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

async function kartochkaniOch(): Promise<HTMLElement> {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Neon Sports Group' }),
  );
  return await screen.findByRole('dialog');
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

    const karta = within(await kartochkaniOch());
    await userEvent.click(
      karta.getByRole('button', { name: 'Tashkilotni bloklash' }),
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

    const karta = within(await kartochkaniOch());
    // Muddat allaqachon o'tgan: blokdan chiqarish holatni ACTIVE
    // qilmaydi va foydalanuvchi buni OLDINDAN bilishi kerak.
    expect(await karta.findByText(/muddati.*o.?tgan/i)).toBeInTheDocument();
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
      '+998993517023',
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
