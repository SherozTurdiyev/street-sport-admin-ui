import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const MENEJER = {
  id: 'm-2',
  userId: 'u-2',
  fullName: 'Bobur Menejerov',
  phone: '+998901110002',
  role: 'MANAGER',
  isActive: true,
  lastLoginAt: '2026-08-27T04:19:10.373Z',
  venueIds: [],
};

const DETAIL = {
  ...MENEJER,
  stats: {
    bookingsCreated: 12,
    bookingsCancelled: 1,
    cashReceived: '1250000',
    shiftDiscrepancies: [],
  },
};

let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers() {
  return [
    ...authedHandlers(DIRECTOR_ME),
    http.get(`${API}/members`, () =>
      HttpResponse.json({ items: [MENEJER], total: 1, page: 1, pageSize: 20 }),
    ),
    http.get(`${API}/members/u-2`, () => HttpResponse.json(DETAIL)),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({
        items: [{ id: 'v-1', name: 'Chilonzor maydoni' }],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
    ),
  ];
}

async function kartochkaniOch(): Promise<HTMLElement> {
  // Jadval bo'sh holda ham darhol chiziladi, shuning uchun QATORNI
  // kutish kerak — jadvalning o'zini emas.
  await userEvent.click(
    await screen.findByRole('button', { name: 'Bobur Menejerov' }),
  );
  return await screen.findByRole('dialog');
}

beforeEach(() => {
  yuborilgan = [];
});

describe('Xodim kartochkasi', () => {
  it('statistikani ko`rsatadi va pulni satrligicha chizadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/members' });

    const karta = within(await kartochkaniOch());
    expect(await karta.findByText('12')).toBeInTheDocument();
    expect(karta.getByText("1 250 000 so'm")).toBeInTheDocument();
  });

  it('rolni o`zgartirishda serverning stadion talabini ko`rsatadi', async () => {
    const XABAR =
      'Administrator uchun kamida bitta stadion biriktirilishi kerak.';
    server.use(
      ...baseHandlers(),
      http.patch(`${API}/members/u-2/role`, () =>
        HttpResponse.json(
          { code: 'MEMBER_VENUE_REQUIRED', message: XABAR },
          { status: 422 },
        ),
      ),
    );
    renderApp(<AppRouter />, { route: '/members' });

    const karta = within(await kartochkaniOch());
    await userEvent.click(karta.getByLabelText('Lavozim'));
    await userEvent.click(await screen.findByTitle('Administrator'));
    await userEvent.click(
      karta.getByRole('button', { name: 'Lavozimni saqlash' }),
    );

    expect(await karta.findByText(XABAR)).toBeInTheDocument();
  });

  it('faolsizlantirishdan OLDIN tasdiq so`raydi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(`${API}/members/u-2/deactivate`, async ({ request }) => {
        yuborilgan.push({ url: request.url, body: null });
        return HttpResponse.json({ userId: 'u-2', isActive: false });
      }),
    );
    renderApp(<AppRouter />, { route: '/members' });

    const karta = within(await kartochkaniOch());
    await userEvent.click(
      karta.getByRole('button', { name: 'Faolsizlantirish' }),
    );

    // Tasdiq oynasi chiqdi, lekin so'rov HALI ketmadi.
    expect(yuborilgan).toEqual([]);
    await userEvent.click(await screen.findByRole('button', { name: 'Ha' }));

    expect(await screen.findByText(/faolsizlantirildi/i)).toBeInTheDocument();
    expect(yuborilgan).toHaveLength(1);
  });

  it('stadion ro`yxatini BUTUNLAY almashtiradi', async () => {
    server.use(
      ...baseHandlers(),
      http.put(`${API}/members/u-2/venues`, async ({ request }) => {
        yuborilgan.push({ url: request.url, body: await request.json() });
        return HttpResponse.json({ userId: 'u-2', venueIds: ['v-1'] });
      }),
    );
    renderApp(<AppRouter />, { route: '/members' });

    const karta = within(await kartochkaniOch());
    await userEvent.click(
      await karta.findByRole('checkbox', { name: 'Chilonzor maydoni' }),
    );
    await userEvent.click(
      karta.getByRole('button', { name: 'Stadionlarni saqlash' }),
    );

    expect(yuborilgan).toEqual([
      { url: `${API}/members/u-2/venues`, body: { venueIds: ['v-1'] } },
    ]);
  });
});
