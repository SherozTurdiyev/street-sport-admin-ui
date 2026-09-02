import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const FOTO = {
  id: 'p-1',
  key: 'orgs/o-1/venues/v-1/p-1.png',
  url: '/api/v1/files/p-1',
  isPrimary: true,
};

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
  photos: [FOTO],
  description: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const YOPILISH = {
  id: 'c-1',
  venueId: 'v-1',
  startsAt: '2026-09-10T05:00:00.000Z',
  endsAt: '2026-09-10T15:00:00.000Z',
  reason: 'Maydon ta’miri',
  createdBy: 'u-1',
  createdAt: '2026-09-01T00:00:00.000Z',
};

let yuborilgan: { url: string; body: unknown }[] = [];
let formData: FormData | null = null;

function baseHandlers() {
  return [
    ...authedHandlers(DIRECTOR_ME),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({ items: [STADION], total: 1, page: 1, pageSize: 20 }),
    ),
    http.get(`${API}/venues/v-1`, () =>
      HttpResponse.json({ ...STADION, hours: [], closures: [YOPILISH] }),
    ),
  ];
}

async function bolimniOch(nomi: string): Promise<HTMLElement> {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Chilonzor Arena' }),
  );
  const karta = await screen.findByRole('dialog');
  await userEvent.click(within(karta).getByRole('tab', { name: nomi }));
  return karta;
}

beforeEach(() => {
  yuborilgan = [];
  formData = null;
});

describe('Stadion fotolari', () => {
  it('rasmni backend manzilidan ko`rsatadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/venues' });

    const fotolar = within(await bolimniOch('Fotolar'));
    // Nom bo'yicha: antd oynasining yopish ikonkasi ham `role="img"`.
    const img = await fotolar.findByRole('img', { name: 'Stadion rasmi' });

    // Havola server ildizidan keladi (`/api/v1/files/...`). Uni
    // shundayligicha qo'yish adminka manzilidan qidirilishiga olib
    // kelardi va rasm ochilmasdi.
    expect(img).toHaveAttribute(
      'src',
      'http://localhost:3001/api/v1/files/p-1',
    );
  });

  it('faylni FormData bilan yuboradi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(`${API}/venues/v-1/photos`, async ({ request }) => {
        formData = await request.formData();
        return HttpResponse.json({ photos: [FOTO] }, { status: 201 });
      }),
    );
    renderApp(<AppRouter />, { route: '/venues' });

    const fotolar = within(await bolimniOch('Fotolar'));
    const file = new File(['x'], 'maydon.png', { type: 'image/png' });
    await userEvent.upload(fotolar.getByLabelText('Rasm fayli'), file);

    await screen.findByText(/rasm yuklandi/i);
    // Maydon nomi backend kutgani bilan bir xil bo'lishi shart.
    // Maydon nomi backend kutgani bilan bir xil bo'lishi shart. Tipni
    // tekshirmaymiz: MSW faylni boshqa muhitdan qaytaradi va
    // `instanceof File` u yerda ishlamaydi.
    expect((formData as FormData | null)?.has('file')).toBe(true);
  });

  it('rasm cheklovi xabarini ko`rsatadi', async () => {
    const XABAR = 'Bitta stadionga 10 tadan ortiq rasm yuklab bo‘lmaydi.';
    server.use(
      ...baseHandlers(),
      http.post(`${API}/venues/v-1/photos`, () =>
        HttpResponse.json(
          { code: 'VENUE_PHOTO_LIMIT', message: XABAR },
          { status: 409 },
        ),
      ),
    );
    renderApp(<AppRouter />, { route: '/venues' });

    const fotolar = within(await bolimniOch('Fotolar'));
    await userEvent.upload(
      fotolar.getByLabelText('Rasm fayli'),
      new File(['x'], 'a.png', { type: 'image/png' }),
    );

    expect(await fotolar.findByText(XABAR)).toBeInTheDocument();
  });
});

describe('Vaqtinchalik yopilishlar', () => {
  it('davrda bron bo`lsa tasdiq so`raydi, keyin bekor qiladi', async () => {
    const XABAR = 'Bu davrda bronlar bor. Ularni bekor qilishni tasdiqlang.';
    server.use(
      ...baseHandlers(),
      http.post(`${API}/venues/v-1/closures`, async ({ request }) => {
        const body = (await request.json()) as { cancelBookings?: boolean };
        yuborilgan.push({ url: request.url, body });
        if (!body.cancelBookings) {
          return HttpResponse.json(
            { code: 'VENUE_CLOSURE_HAS_BOOKINGS', message: XABAR },
            { status: 409 },
          );
        }
        return HttpResponse.json(YOPILISH, { status: 201 });
      }),
    );
    renderApp(<AppRouter />, { route: '/venues' });

    const yopilishlar = within(await bolimniOch('Yopilishlar'));
    // Davr AVVAL to'ldiriladi. Tanlagichdagi Enter qiymatni tasdiqlaydi,
    // lekin ayni paytda formani ham yuboradi; sabab hali bo'sh bo'lgani
    // uchun validatsiya to'sib qoladi va so'rov ketmaydi.
    await userEvent.type(
      yopilishlar.getByPlaceholderText('Boshlanishi'),
      '2026-09-10 10:00{enter}',
    );
    await userEvent.type(
      yopilishlar.getByPlaceholderText('Tugashi'),
      '2026-09-10 20:00{enter}',
    );
    await userEvent.type(yopilishlar.getByLabelText('Sabab'), 'Maydon ta’miri');
    await userEvent.click(
      yopilishlar.getByRole('button', { name: 'Yopilish qo‘shish' }),
    );

    expect(await yopilishlar.findByText(XABAR)).toBeInTheDocument();
    expect(yuborilgan).toHaveLength(1);
    expect(yuborilgan[0]?.body).not.toHaveProperty('cancelBookings');

    // Tasdiqdan keyin bekor qilish sababi bilan qayta yuboriladi.
    await userEvent.click(
      yopilishlar.getByRole('button', { name: 'Bronlarni bekor qilib yopish' }),
    );

    expect(yuborilgan).toHaveLength(2);
    expect(yuborilgan[1]?.body).toMatchObject({
      cancelBookings: true,
      cancelReason: 'VENUE_ISSUE',
      startsAt: '2026-09-10T05:00:00.000Z',
      endsAt: '2026-09-10T15:00:00.000Z',
    });
  });

  it('bekor qilingan bronlar tiklanmasligini aytadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/venues' });

    const yopilishlar = within(await bolimniOch('Yopilishlar'));
    expect(
      await yopilishlar.findByText(/avtomatik\s+tiklanmaydi/i),
    ).toBeInTheDocument();
  });
});
