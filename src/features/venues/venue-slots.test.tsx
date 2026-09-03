import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  ADMIN_ME,
  DIRECTOR_ME,
  authedHandlers,
  venueDayHandlers,
} from '@/test/handlers';
import { TASHKENT } from '@/shared/format/time';
import { AppRouter } from '@/app/router';

/**
 * Vaqt jadvali — ishlaydigan panjara: bo'sh soatga bosilsa tez bron,
 * band soatga bosilsa bron kartochkasi.
 */

const STADION = {
  id: 'v-1',
  orgId: 'o-1',
  name: 'Chilonzor Arena',
  sportType: 'FOOTBALL_5X5',
  surface: null,
  sizeLabel: null,
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

/** Haftaning yettala kuni ochiq — panjara qaysi kunda ham chiziladi. */
const HOURS = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  opensAt: '00:00',
  closesAt: '24:00',
}));

const BUGUN = dayjs().tz(TASHKENT).format('YYYY-MM-DD');
/** Fixture kun boshi sifatida shuni qaytaradi (Toshkent yarim tuni). */
const KUN_BOSHI = `${BUGUN}T19:00:00.000Z`;
const BRON_BOSHI = dayjs(KUN_BOSHI).add(10, 'hour').toISOString();
const BRON_OXIRI = dayjs(KUN_BOSHI).add(11, 'hour').toISOString();

const BRON = {
  id: 'b-1',
  venueId: 'v-1',
  customerId: 'c-1',
  seriesId: null,
  startsAt: BRON_BOSHI,
  endsAt: BRON_OXIRI,
  priceTotal: '150000',
  discount: '0',
  status: 'CONFIRMED',
  source: 'PANEL',
  cancelReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers(me: object = DIRECTOR_ME, bookings: object[] = []) {
  return [
    ...authedHandlers(me),
    http.get(`${API}/venues/v-1`, () =>
      HttpResponse.json({ ...STADION, hours: HOURS, closures: [] }),
    ),
    http.get(`${API}/venues/v-1/hours`, () => HttpResponse.json(HOURS)),
    http.get(`${API}/venues/v-1/price-rules`, () => HttpResponse.json([])),
    http.get(`${API}/bookings/b-1`, () =>
      HttpResponse.json({
        ...BRON,
        venue: { id: 'v-1', name: 'Chilonzor Arena', sportType: 'FOOTBALL_5X5', slotMinutes: 60 },
        customer: {
          id: 'c-1',
          phone: '+998901112233',
          fullName: 'Alisher Rahimov',
          isBlacklisted: false,
        },
      }),
    ),
    http.post(`${API}/customers/lookup`, async ({ request }) => {
      yuborilgan.push({ url: 'lookup', body: await request.json() });
      return HttpResponse.json({
        created: false,
        customer: {
          id: 'c-1',
          phone: '+998901112233',
          fullName: 'Alisher Rahimov',
          note: null,
          tags: [],
          isBlacklisted: false,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });
    }),
    http.post(`${API}/bookings`, async ({ request }) => {
      yuborilgan.push({ url: 'create', body: await request.json() });
      return HttpResponse.json({ ...BRON, warnings: [] }, { status: 201 });
    }),
    ...venueDayHandlers('v-1', { hours: HOURS, bookings }),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({ items: [STADION], total: 1, page: 1, pageSize: 20 }),
    ),
  ];
}

describe('Vaqt jadvali kataklari', () => {
  it('bo`sh soatga bosilganda tez bron oynasi ochiladi', async () => {
    yuborilgan = [];
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/venues/v-1' });

    // Kechqurun ham kelajakda turishi kafolatlangan katak.
    const katak = await screen.findByRole('button', {
      name: '23:00 — bron qilish',
    });
    await userEvent.click(katak);

    const oyna = within(await screen.findByRole('dialog'));
    // Stadion va vaqt oldindan to'ldirilgan — operator faqat mijozni
    // ko'rsatadi.
    expect(oyna.getByText('Chilonzor Arena')).toBeInTheDocument();

    await userEvent.type(oyna.getByLabelText('Mijoz telefoni'), '901112233');
    await userEvent.tab();
    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    await screen.findByText('Bron yaratildi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'create',
      body: { venueId: 'v-1', customerId: 'c-1' },
    });
  });

  it('band soatga bosilganda bron kartochkasi ochiladi', async () => {
    server.use(...baseHandlers(DIRECTOR_ME, [BRON]));
    renderApp(<AppRouter />, { route: '/venues/v-1' });

    const katak = await screen.findByRole('button', {
      name: '10:00 — bronni ochish',
    });
    await userEvent.click(katak);

    expect(await screen.findByText('Alisher Rahimov')).toBeInTheDocument();
  });

  it('bron qila olmaydigan xodimda bo`sh katak bosilmaydi', async () => {
    // Administratorda `booking.create` bor, shuning uchun uni
    // ruxsatsiz holatga keltiramiz: oyna ochilib keyin 403 qaytishi
    // chalg'ituvchi bo'lardi.
    server.use(...baseHandlers({ ...ADMIN_ME, permissions: [] }));
    renderApp(<AppRouter />, { route: '/venues/v-1' });

    const katak = await screen.findByRole('button', { name: '23:00 — Bo‘sh' });
    expect(katak).toBeDisabled();
  });
});
