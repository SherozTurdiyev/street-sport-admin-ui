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

/** antd oynalari ustma-ust ochiladi — oxirgisi kerak bo'ladi. */
async function oxirgiOyna(): Promise<HTMLElement> {
  const oynalar = await screen.findAllByRole('dialog');
  return oynalar[oynalar.length - 1] as HTMLElement;
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

describe('Bron kartochkasi', () => {
  const KARTOCHKA = {
    ...BRON,
    venue: {
      id: 'v-1',
      name: 'Chilonzor Arena',
      sportType: 'FOOTBALL_5X5',
      slotMinutes: 60,
    },
    customer: {
      id: 'c-1',
      phone: '+998901112233',
      fullName: 'Alisher Rahimov',
      isBlacklisted: false,
    },
  };

  function kartochkaHandlers(card: object = KARTOCHKA) {
    return [
      http.get(`${API}/bookings/b-1`, () => HttpResponse.json(card)),
      http.patch(`${API}/bookings/b-1/move`, async ({ request }) => {
        const body = await request.json();
        yuborilgan.push({ url: 'move', body });
        return HttpResponse.json({ ...BRON, warnings: [] });
      }),
      http.post(`${API}/bookings/b-1/cancel`, async ({ request }) => {
        const body = await request.json();
        yuborilgan.push({ url: 'cancel', body });
        return HttpResponse.json({ ...BRON, status: 'CANCELLED' });
      }),
      http.post(`${API}/bookings/b-1/result`, async ({ request }) => {
        const body = await request.json();
        yuborilgan.push({ url: 'result', body });
        return HttpResponse.json({ ...BRON, status: 'COMPLETED' });
      }),
      ...baseHandlers(),
    ];
  }

  it('blok bosilsa kartochka ochiladi va manzilga tushadi', async () => {
    server.use(...kartochkaHandlers());
    renderApp(<AppRouter />, { route: '/bookings' });

    await userEvent.click(
      await screen.findByRole('button', { name: /bronni ochish/ }),
    );

    const oyna = within(await screen.findByRole('dialog'));
    expect(await oyna.findByText('Alisher Rahimov')).toBeInTheDocument();
    expect(oyna.getByText("300 000 so'm")).toBeInTheDocument();
    // Manzil orqali ochilishi keyingi testda: u `?booking=b-1` bilan
    // boshlanadi va o'sha kartochkani ko'rsatadi.
  });

  it('o`yin tugamaguncha natija tugmalari yo`q', async () => {
    server.use(...kartochkaHandlers());
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    const oyna = within(await screen.findByRole('dialog'));
    await oyna.findByText('Alisher Rahimov');
    // Hozir 05:00Z, bron esa 16:00Z da tugaydi.
    expect(oyna.queryByRole('button', { name: 'Yakunlandi' })).toBeNull();
  });

  it('tugagan o`yinga natija belgilanadi', async () => {
    vi.setSystemTime(new Date('2026-09-02T05:00:00.000Z'));
    server.use(...kartochkaHandlers());
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    const oyna = within(await screen.findByRole('dialog'));
    await userEvent.click(
      await oyna.findByRole('button', { name: 'Yakunlandi' }),
    );

    await screen.findByText('Natija belgilandi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'result',
      body: { result: 'COMPLETED' },
    });
  });

  it('bekor qilishda sabab majburiy', async () => {
    server.use(...kartochkaHandlers());
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    const oyna = within(await screen.findByRole('dialog'));
    await userEvent.click(
      await oyna.findByRole('button', { name: 'Bekor qilish' }),
    );

    const modal = within(await oxirgiOyna());
    await userEvent.click(modal.getByRole('button', { name: 'Bekor qilish' }));
    expect(await modal.findByText('Sababni tanlang')).toBeInTheDocument();

    await userEvent.click(modal.getByLabelText('Sabab'));
    await userEvent.click(await screen.findByTitle('Ob-havo'));
    await userEvent.click(modal.getByRole('button', { name: 'Bekor qilish' }));

    await screen.findByText('Bron bekor qilindi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'cancel',
      body: { reason: 'WEATHER' },
    });
  });

  it('narx o`zgarsa tasdiq so`raydi va ikkinchi so`rov tasdiq bilan ketadi', async () => {
    let birinchi = true;
    server.use(
      http.patch(`${API}/bookings/b-1/move`, async ({ request }) => {
        const body = await request.json();
        yuborilgan.push({ url: 'move', body });
        if (birinchi) {
          birinchi = false;
          return HttpResponse.json(
            {
              code: 'BOOKING_PRICE_CHANGED',
              message: 'Yangi vaqt uchun narx boshqacha.',
              details: { oldPrice: '150000', newPrice: '260000' },
            },
            { status: 409 },
          );
        }
        return HttpResponse.json({ ...BRON, warnings: [] });
      }),
      ...kartochkaHandlers(),
    );
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    const oyna = within(await screen.findByRole('dialog'));
    await userEvent.click(
      await oyna.findByRole('button', { name: 'Ko‘chirish' }),
    );
    const modal = within(await oxirgiOyna());
    await userEvent.click(modal.getByRole('button', { name: 'Ko‘chirish' }));

    expect(await screen.findByText('Narx o‘zgaradi')).toBeInTheDocument();
    expect(screen.getByText("150 000 so'm")).toBeInTheDocument();
    expect(screen.getByText("260 000 so'm")).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }));

    await screen.findByText('Bron ko‘chirildi');
    expect(yuborilgan.at(-1)?.body).toMatchObject({
      confirmPriceChange: true,
    });
  });
});
