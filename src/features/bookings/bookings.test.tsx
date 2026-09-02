import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

/** Toshkent kuni UTC da 19:00 da boshlanadi. */
const KUN = '2026-09-01';
const FROM = '2026-08-31T19:00:00.000Z';

const BRON = {
  id: 'b-1',
  venueId: 'v-1',
  customerId: 'c-1',
  seriesId: null,
  startsAt: '2026-09-01T14:00:00.000Z',
  endsAt: '2026-09-01T16:00:00.000Z',
  priceTotal: '300000',
  discount: '0',
  status: 'CONFIRMED',
  source: 'PANEL',
  cancelReason: null,
  createdAt: FROM,
};

const STADION = {
  venueId: 'v-1',
  name: 'Chilonzor Arena',
  slotMinutes: 60,
  status: 'ACTIVE',
  hours: [
    { weekday: 1, opensAt: '08:00', closesAt: '23:00' },
    { weekday: 2, opensAt: '08:00', closesAt: '23:00' },
  ],
  closures: [],
  bookings: [BRON],
};

const MIJOZ = {
  id: 'c-1',
  phone: '+998901112233',
  fullName: 'Alisher Rahimov',
  note: null,
  tags: [],
  isBlacklisted: false,
  createdAt: FROM,
};

let soralgan: URL[] = [];
let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers() {
  return [
    ...authedHandlers(DIRECTOR_ME),
    http.get(`${API}/bookings/calendar/day`, ({ request }) => {
      const url = new URL(request.url);
      soralgan.push(url);
      return HttpResponse.json({
        date: url.searchParams.get('date') ?? KUN,
        from: FROM,
        to: '2026-09-01T19:00:00.000Z',
        venues: [STADION],
      });
    }),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({
        items: [{ id: 'v-1', name: 'Chilonzor Arena' }],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
    ),
  ];
}

beforeEach(() => {
  soralgan = [];
  yuborilgan = [];
  // Panjara "o'tib ketgan" kataklarni hozirgi vaqtga qarab belgilaydi.
  vi.setSystemTime(new Date('2026-09-01T05:00:00.000Z'));
});

describe('Kunlik kalendar', () => {
  it('ustunlar va bron bloki chiziladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings' });

    expect(await screen.findByText('Chilonzor Arena')).toBeInTheDocument();
    // Ikki soatlik bron BITTA blok: ikkita katak emas.
    const bloklar = screen.getAllByRole('button', {
      name: /bronni ochish/,
    });
    expect(bloklar).toHaveLength(1);
    expect(bloklar[0]).toHaveTextContent('19:00–21:00');
  });

  it('«Keyingi kun» so`rovdagi sanani siljitadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings' });
    await screen.findByText('Chilonzor Arena');

    await userEvent.click(screen.getByRole('button', { name: 'Keyingi kun' }));

    expect(soralgan.at(-1)?.searchParams.get('date')).toBe('2026-09-02');
  });

  it('stadion filtri `venueIds` yuboradi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings' });
    await screen.findByText('Chilonzor Arena');

    await userEvent.click(screen.getByLabelText("Stadionlar bo'yicha filtr"));
    await userEvent.click(await screen.findByTitle('Chilonzor Arena'));

    // axios massivni `venueIds[]=` ko'rinishida yuboradi — backend
    // shu shaklni qabul qiladi (stadion sahifasi ham shundan foydalanadi).
    expect(soralgan.at(-1)?.searchParams.getAll('venueIds[]')).toEqual(['v-1']);
  });

  it('hamma stadion yopiq bo`lsa buni aytadi', async () => {
    server.use(
      http.get(`${API}/bookings/calendar/day`, () =>
        HttpResponse.json({
          date: KUN,
          from: FROM,
          to: '2026-09-01T19:00:00.000Z',
          venues: [{ ...STADION, hours: [], bookings: [] }],
        }),
      ),
      ...baseHandlers(),
    );
    renderApp(<AppRouter />, { route: '/bookings' });

    expect(
      await screen.findByText('Bu kuni hamma stadion yopiq'),
    ).toBeInTheDocument();
  });
});

describe('Tez bron', () => {
  function bronHandlers() {
    return [
      http.post(`${API}/customers/lookup`, async ({ request }) => {
        const body = (await request.json()) as { phone: string };
        yuborilgan.push({ url: 'lookup', body });
        return HttpResponse.json(
          body.phone === '+998901112233'
            ? { created: false, customer: MIJOZ }
            : { created: false, customer: null },
        );
      }),
      http.post(`${API}/bookings`, async ({ request }) => {
        const body = await request.json();
        yuborilgan.push({ url: 'create', body });
        return HttpResponse.json({ ...BRON, warnings: [] }, { status: 201 });
      }),
      ...baseHandlers(),
    ];
  }

  async function oynaniOch(): Promise<HTMLElement> {
    renderApp(<AppRouter />, { route: '/bookings' });
    await screen.findByText('Chilonzor Arena');
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Chilonzor Arena 10:00 — bron qilish',
      }),
    );
    return await screen.findByRole('dialog');
  }

  it('bo`sh katak bosilsa oyna vaqt bilan ochiladi', async () => {
    server.use(...bronHandlers());
    const oyna = within(await oynaniOch());

    expect(oyna.getByText('Chilonzor Arena')).toBeInTheDocument();
    expect(oyna.getByText('10:00')).toBeInTheDocument();
  });

  it('mavjud mijozni topadi va bronni yaratadi', async () => {
    server.use(...bronHandlers());
    const oyna = within(await oynaniOch());

    await userEvent.type(oyna.getByLabelText('Mijoz telefoni'), '901112233');
    await userEvent.tab();
    expect(await oyna.findByText('Alisher Rahimov')).toBeInTheDocument();

    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    await screen.findByText('Bron yaratildi');
    expect(yuborilgan.at(-1)?.body).toMatchObject({
      venueId: 'v-1',
      customerId: 'c-1',
      startsAt: '2026-09-01T05:00:00.000Z',
      endsAt: '2026-09-01T06:00:00.000Z',
    });
  });

  it('topilmagan raqamda ism so`raydi', async () => {
    server.use(...bronHandlers());
    const oyna = within(await oynaniOch());

    await userEvent.type(oyna.getByLabelText('Mijoz telefoni'), '905550000');
    await userEvent.tab();

    expect(await oyna.findByLabelText('Mijoz ismi')).toBeInTheDocument();
  });

  it('band vaqtda serverning xatosini ko`rsatadi', async () => {
    server.use(
      http.post(`${API}/bookings`, () =>
        HttpResponse.json(
          { code: 'BOOKING_CONFLICT', message: 'Bu vaqt allaqachon band.' },
          { status: 409 },
        ),
      ),
      ...bronHandlers(),
    );
    const oyna = within(await oynaniOch());

    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    expect(
      await oyna.findByText('Bu vaqt allaqachon band.'),
    ).toBeInTheDocument();
  });

  it('qora ro`yxatdagi mijozda ogohlantiradi, lekin bronni yaratadi', async () => {
    server.use(
      http.post(`${API}/bookings`, () =>
        HttpResponse.json(
          { ...BRON, warnings: ['CUSTOMER_BLACKLISTED'] },
          { status: 201 },
        ),
      ),
      ...bronHandlers(),
    );
    const oyna = within(await oynaniOch());

    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    expect(await screen.findByText('Bron yaratildi')).toBeInTheDocument();
    expect(await screen.findByText('Mijoz qora ro‘yxatda')).toBeInTheDocument();
  });
});
