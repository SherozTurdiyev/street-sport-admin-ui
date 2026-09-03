import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, ADMIN_ME, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const MIJOZ = {
  id: 'c-1',
  phone: '+998901112233',
  fullName: 'Alisher Rahimov',
  note: 'Doimiy mijoz',
  tags: ['VIP'],
  isBlacklisted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const KARTOCHKA = {
  ...MIJOZ,
  stats: {
    totalBookings: 12,
    completedCount: 9,
    cancelledCount: 2,
    noShowCount: 1,
    lastVisitAt: '2026-08-30T14:00:00.000Z',
    totalPaid: '450000',
    currentDebt: '120000',
  },
  bookings: [
    {
      id: 'b-1',
      venueId: 'v-1',
      customerId: 'c-1',
      seriesId: null,
      startsAt: '2026-08-30T14:00:00.000Z',
      endsAt: '2026-08-30T15:00:00.000Z',
      priceTotal: '150000',
      discount: '0',
      status: 'COMPLETED',
      source: 'PANEL',
      cancelReason: null,
      createdAt: '2026-08-30T10:00:00.000Z',
    },
  ],
};

let soralgan: URL[] = [];
let yuborilgan: { url: string; body: unknown }[] = [];

/** `me` — direktor yoki administrator: ruxsat testlari shunga tayanadi. */
function baseHandlers(me: object = DIRECTOR_ME) {
  return [
    ...authedHandlers(me),
    http.get(`${API}/customers`, ({ request }) => {
      soralgan.push(new URL(request.url));
      return HttpResponse.json({
        items: [MIJOZ],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    }),
    http.get(`${API}/customers/c-1`, () => HttpResponse.json(KARTOCHKA)),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({
        items: [{ id: 'v-1', name: 'Chilonzor Arena' }],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
    ),
    http.patch(`${API}/customers/c-1`, async ({ request }) => {
      yuborilgan.push({ url: 'update', body: await request.json() });
      return HttpResponse.json(MIJOZ);
    }),
    http.patch(`${API}/customers/c-1/blacklist`, async ({ request }) => {
      yuborilgan.push({ url: 'blacklist', body: await request.json() });
      return HttpResponse.json({ ...MIJOZ, isBlacklisted: true });
    }),
  ];
}

beforeEach(() => {
  soralgan = [];
  yuborilgan = [];
});

describe('Mijozlar ro`yxati', () => {
  it('ism va maskali telefon bilan chiziladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/customers' });

    const jadval = within(await screen.findByRole('table'));
    expect(await jadval.findByText('Alisher Rahimov')).toBeInTheDocument();
    expect(jadval.getByText('+998 (90) 111-22-33')).toBeInTheDocument();
    expect(jadval.getByText('VIP')).toBeInTheDocument();
  });

  it('qidiruv va qora ro`yxat filtri so`rovga tushadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/customers' });
    await screen.findByRole('table');

    await userEvent.type(screen.getByLabelText('Qidiruv'), 'Alisher{Enter}');
    expect(soralgan.at(-1)?.searchParams.get('search')).toBe('Alisher');

    await userEvent.click(screen.getByRole('checkbox', { name: /qora ro/i }));
    expect(soralgan.at(-1)?.searchParams.get('blacklistedOnly')).toBe('true');
  });
});

describe('Mijoz sahifasi', () => {
  it('statistika va bronlar tarixi ko`rinadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/customers/c-1' });

    expect(
      await screen.findByRole('heading', { name: 'Alisher Rahimov' }),
    ).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    const jadval = within(screen.getByRole('table'));
    // Stadion nomi alohida so'rovdan keladi — kutish kerak.
    expect(await jadval.findByText('Chilonzor Arena')).toBeInTheDocument();
    expect(jadval.getByText("150 000 so'm")).toBeInTheDocument();
  });

  it('to`lagan summasi va qarzi ko`rsatiladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/customers/c-1' });

    expect(await screen.findByText("450 000 so'm")).toBeInTheDocument();
    // Qarz alohida: kassada eng ko'p so'raladigan raqam.
    expect(screen.getByText("120 000 so'm")).toBeInTheDocument();
  });

  it('administratorda qora ro`yxat tugmasi yo`q', async () => {
    server.use(...baseHandlers(ADMIN_ME));
    renderApp(<AppRouter />, { route: '/customers/c-1' });

    await screen.findByRole('heading', { name: 'Alisher Rahimov' });
    expect(
      screen.queryByRole('button', { name: /qora ro/i }),
    ).not.toBeInTheDocument();
    // Tahrirlash esa ochiq — unda `customer.manage` bor.
    expect(
      screen.getByRole('button', { name: 'Tahrirlash' }),
    ).toBeInTheDocument();
  });

  it('tahrirlash telefonni o`zgartirmaydi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/customers/c-1' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Tahrirlash' }),
    );
    const oyna = within(await screen.findByRole('dialog'));
    expect(oyna.getByLabelText('Telefon')).toBeDisabled();

    const ism = oyna.getByLabelText('Ism va familiya');
    await userEvent.clear(ism);
    await userEvent.type(ism, 'Alisher R.');
    await userEvent.click(oyna.getByRole('button', { name: 'Saqlash' }));

    await screen.findByText('Saqlandi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'update',
      body: { fullName: 'Alisher R.' },
    });
  });

  it('qora ro`yxatga qo`shadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/customers/c-1' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Qora ro‘yxatga qo‘shish' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Ha' }));

    await screen.findByText('Qora ro‘yxatga qo‘shildi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'blacklist',
      body: { isBlacklisted: true },
    });
  });
});
