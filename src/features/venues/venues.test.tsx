import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const STADION = {
  id: 'v-1',
  orgId: 'o-1',
  name: 'Chilonzor Arena',
  sportType: 'FOOTBALL_5X5',
  surface: 'ARTIFICIAL_GRASS',
  sizeLabel: '40x20',
  isIndoor: false,
  city: 'Toshkent',
  address: 'Chilonzor 5',
  latitude: null,
  longitude: null,
  contactPhone: '+998712000000',
  slotMinutes: 60,
  amenities: ['SHOWER', 'PARKING'],
  photos: [],
  description: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  basePricePerHour: '150000',
};

const DETAIL = {
  ...STADION,
  hours: [{ weekday: 1, opensAt: '08:00', closesAt: '23:00' }],
  closures: [],
};

let soraldi: URL[] = [];
let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers() {
  return [
    ...authedHandlers(DIRECTOR_ME),
    http.get(`${API}/venues`, ({ request }) => {
      const url = new URL(request.url);
      soraldi.push(url);
      return HttpResponse.json({
        items: [STADION],
        total: 1,
        page: Number(url.searchParams.get('page') ?? '1'),
        pageSize: 20,
      });
    }),
    http.get(`${API}/venues/v-1`, () => HttpResponse.json(DETAIL)),
    http.get(`${API}/venues/v-1/hours`, () =>
      HttpResponse.json({ venueId: 'v-1', hours: DETAIL.hours }),
    ),
  ];
}

function oxirgi(): URL {
  const url = soraldi.at(-1);
  if (!url) throw new Error("Hech qanday so'rov ketmadi");
  return url;
}

async function kartochkaniOch(): Promise<HTMLElement> {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Chilonzor Arena — ochish' }),
  );
  return await screen.findByRole('dialog');
}

beforeEach(() => {
  soraldi = [];
  yuborilgan = [];
});

describe('Stadionlar', () => {
  it('ro`yxatni ko`rsatadi va shahar filtrini yuboradi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/venues' });

    expect(
      await screen.findByRole('heading', { name: 'Chilonzor Arena' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Futbol 5x5')).toBeInTheDocument();
    // Bazaviy narx kartochkadagi eng ko'rinarli qiymat (BR-13: satr).
    expect(screen.getByText(/150 000 so'm\/soat/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Shahar'), 'Toshkent{enter}');

    expect(oxirgi().searchParams.get('city')).toBe('Toshkent');
    // Filtr o'zgarganda sahifa birinchiga qaytadi.
    expect(oxirgi().searchParams.get('page')).toBe('1');
  });

  it('yangi stadion yaratganda slotMinutes 60 ketadi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(`${API}/venues`, async ({ request }) => {
        yuborilgan.push({ url: request.url, body: await request.json() });
        return HttpResponse.json(STADION, { status: 201 });
      }),
    );
    renderApp(<AppRouter />, { route: '/venues' });

    await screen.findByRole('heading', { name: 'Chilonzor Arena' });
    await userEvent.click(
      screen.getByRole('button', { name: /Yangi stadion/ }),
    );

    const oyna = within(await screen.findByRole('dialog'));
    await userEvent.type(oyna.getByLabelText('Nomi'), 'Chilonzor Arena');
    await userEvent.click(oyna.getByLabelText('Sport turi'));
    await userEvent.click(await screen.findByTitle('Futbol 5x5'));
    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    await screen.findByText(/yaratildi/i);
    expect(yuborilgan).toHaveLength(1);
    expect(yuborilgan[0]?.body).toMatchObject({
      name: 'Chilonzor Arena',
      sportType: 'FOOTBALL_5X5',
      slotMinutes: 60,
    });
  });

  it('faol broni bor stadionni arxivlashda tasdiq so`raydi', async () => {
    let confirmed = false;
    server.use(
      ...baseHandlers(),
      http.post(`${API}/venues/v-1/archive`, async ({ request }) => {
        const body = (await request.json()) as { confirm?: boolean };
        yuborilgan.push({ url: request.url, body });
        if (!body.confirm) {
          return HttpResponse.json(
            {
              code: 'VENUE_HAS_ACTIVE_BOOKINGS',
              message: 'Bu stadionda faol bronlar bor. Arxivlashni tasdiqlang.',
            },
            { status: 409 },
          );
        }
        confirmed = true;
        return HttpResponse.json({ ...STADION, status: 'ARCHIVED' });
      }),
    );
    renderApp(<AppRouter />, { route: '/venues' });

    const karta = within(await kartochkaniOch());
    await userEvent.click(karta.getByRole('button', { name: 'Arxivlash' }));

    // Birinchi urinish `confirm: false` bilan ketdi va 409 qaytdi.
    expect(await karta.findByText(/faol bronlar bor/i)).toBeInTheDocument();
    expect(confirmed).toBe(false);

    // Endi tasdiq tugmasi paydo bo'ladi.
    await userEvent.click(
      karta.getByRole('button', { name: 'Baribir arxivlash' }),
    );

    expect(yuborilgan).toEqual([
      { url: `${API}/venues/v-1/archive`, body: { confirm: false } },
      { url: `${API}/venues/v-1/archive`, body: { confirm: true } },
    ]);
  });

  it('haftaning YETTALA kunini ko`rsatadi va yopiq kunni yubormaydi', async () => {
    server.use(
      ...baseHandlers(),
      http.put(`${API}/venues/v-1/hours`, async ({ request }) => {
        const body = await request.json();
        yuborilgan.push({ url: request.url, body });
        return HttpResponse.json({ venueId: 'v-1', hours: [] });
      }),
    );
    renderApp(<AppRouter />, { route: '/venues' });

    const karta = within(await kartochkaniOch());
    await userEvent.click(karta.getByRole('tab', { name: 'Ish vaqti' }));

    // Yettala kun ko'rinadi — "kun qo'shish" tugmasi emas.
    for (const kun of ['Dushanba', 'Seshanba', 'Yakshanba']) {
      expect(await karta.findByLabelText(kun)).toBeInTheDocument();
    }

    // Serverda faqat dushanba ochiq edi; yopiq kunlar massivga kirmaydi.
    await userEvent.click(
      karta.getByRole('button', { name: 'Ish vaqtini saqlash' }),
    );

    expect(yuborilgan).toEqual([
      {
        url: `${API}/venues/v-1/hours`,
        body: { hours: [{ weekday: 1, opensAt: '08:00', closesAt: '23:00' }] },
      },
    ]);
  });

  it('yarim tundan o`tuvchi vaqtni xato deb ko`rsatmaydi', async () => {
    // Almashtiruvchi handler OLDINDA: bitta `server.use` chaqiruvida
    // birinchi mos keluvchi ishlaydi.
    server.use(
      http.get(`${API}/venues/v-1/hours`, () =>
        HttpResponse.json({
          venueId: 'v-1',
          hours: [{ weekday: 1, opensAt: '18:00', closesAt: '02:00' }],
        }),
      ),
      http.put(`${API}/venues/v-1/hours`, async ({ request }) => {
        yuborilgan.push({ url: request.url, body: await request.json() });
        return HttpResponse.json({ venueId: 'v-1', hours: [] });
      }),
      ...baseHandlers(),
    );
    renderApp(<AppRouter />, { route: '/venues' });

    const karta = within(await kartochkaniOch());
    await userEvent.click(karta.getByRole('tab', { name: 'Ish vaqti' }));
    await userEvent.click(
      await karta.findByRole('button', { name: 'Ish vaqtini saqlash' }),
    );

    expect(yuborilgan).toEqual([
      {
        url: `${API}/venues/v-1/hours`,
        body: { hours: [{ weekday: 1, opensAt: '18:00', closesAt: '02:00' }] },
      },
    ]);
  });
});
