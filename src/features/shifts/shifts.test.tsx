import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, ADMIN_ME, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const STADION = { id: 'v-1', name: 'Chilonzor Arena' };

const OCHIQ = {
  id: 's-1',
  venueId: 'v-1',
  venueName: 'Chilonzor Arena',
  userId: 'u-1',
  userName: 'Anvar Direktorov',
  openedAt: '2026-09-02T04:00:00.000Z',
  closedAt: null,
  openingCash: '100000',
  declaredCash: null,
  systemCash: null,
  difference: null,
  comment: null,
  status: 'OPEN',
  expectedCash: '250000',
  cashPaymentTotal: '200000',
  cashRefundTotal: '50000',
  paymentCount: 3,
};

const YOPILGAN = {
  ...OCHIQ,
  id: 's-0',
  closedAt: '2026-09-01T14:00:00.000Z',
  declaredCash: '240000',
  systemCash: '250000',
  difference: '-10000',
  status: 'CLOSED',
};

let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers(me: object = DIRECTOR_ME, joriy: object | null = OCHIQ) {
  return [
    ...authedHandlers(me),
    http.get(`${API}/shifts/current`, () =>
      HttpResponse.json({ shift: joriy }),
    ),
    http.get(`${API}/shifts`, () =>
      HttpResponse.json({
        items: [YOPILGAN],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    ),
    http.post(`${API}/shifts/open`, async ({ request }) => {
      yuborilgan.push({ url: 'open', body: await request.json() });
      return HttpResponse.json(OCHIQ, { status: 201 });
    }),
    http.post(`${API}/shifts/s-1/close`, async ({ request }) => {
      yuborilgan.push({ url: 'close', body: await request.json() });
      return HttpResponse.json(YOPILGAN);
    }),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({ items: [STADION], total: 1, page: 1, pageSize: 100 }),
    ),
  ];
}

beforeEach(() => {
  yuborilgan = [];
});

async function oxirgiOyna(): Promise<HTMLElement> {
  const oynalar = await screen.findAllByRole('dialog');
  return oynalar[oynalar.length - 1] as HTMLElement;
}

describe('Joriy smena', () => {
  it('kutilayotgan qoldiq va tarkibi ko`rinadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/shifts' });

    expect(await screen.findByText('Kassir')).toBeInTheDocument();
    expect(screen.getByText("200 000 so'm")).toBeInTheDocument();
    expect(screen.getByText("50 000 so'm")).toBeInTheDocument();
  });

  it('smena yo`q bo`lsa naqd to`lov haqida ogohlantiradi', async () => {
    server.use(...baseHandlers(DIRECTOR_ME, null));
    renderApp(<AppRouter />, { route: '/shifts' });

    expect(
      await screen.findByText(/Naqd to‘lov qabul qilish uchun/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Smenani ochish' }),
    ).toBeInTheDocument();
  });

  it('smena ochishda boshlang`ich qoldiq yuboriladi', async () => {
    server.use(...baseHandlers(DIRECTOR_ME, null));
    renderApp(<AppRouter />, { route: '/shifts' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Smenani ochish' }),
    );
    const oyna = within(await oxirgiOyna());
    await userEvent.type(oyna.getByLabelText('Boshlang‘ich qoldiq'), '100000');
    await userEvent.click(oyna.getByRole('button', { name: 'Ochish' }));

    await screen.findByText('Smena ochildi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'open',
      body: { venueId: 'v-1', openingCash: '100000' },
    });
  });

  it('yopishda tizim hisobi ko`rsatiladi va farq xabar qilinadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/shifts' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Smenani yopish' }),
    );
    const oyna = within(await oxirgiOyna());

    // Tizim soni yashirilmaydi: kassir uni baribir yopishda ko'radi.
    expect(oyna.getByText(/Tizim hisobi: 250 000/)).toBeInTheDocument();
    // Sanalgan summa oldindan tizim hisobi bilan to'ladi.
    expect(oyna.getByLabelText('Sanalgan summa')).toHaveValue('250 000');

    await userEvent.click(
      oyna.getByRole('button', { name: 'Yopish va yakunlash' }),
    );

    expect(await screen.findByText(/Farq: −?-?10 000/)).toBeInTheDocument();
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'close',
      body: { declaredCash: '250000' },
    });
  });

  it('smena boshqarolmaydigan xodimda tugmalar yo`q', async () => {
    server.use(
      ...baseHandlers({ ...ADMIN_ME, permissions: ['shift.own.view'] }, null),
    );
    renderApp(<AppRouter />, { route: '/shifts' });

    await screen.findByText(/Naqd to‘lov qabul qilish uchun/);
    expect(
      screen.queryByRole('button', { name: 'Smenani ochish' }),
    ).not.toBeInTheDocument();
  });
});

describe('Smenalar tarixi', () => {
  it('farq ustuni bilan chiziladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/shifts' });

    const jadval = within(await screen.findByRole('table'));
    expect(await jadval.findByText("240 000 so'm")).toBeInTheDocument();
    // Farq manfiy: kassada tizim hisoblaganidan kam pul chiqqan.
    expect(jadval.getByText("-10 000 so'm")).toBeInTheDocument();
  });
});
