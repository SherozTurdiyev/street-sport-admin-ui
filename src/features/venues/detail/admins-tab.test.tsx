import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AdminsTab } from './AdminsTab';

const ADMIN_1 = {
  id: 'm-1',
  userId: 'u-3',
  fullName: 'Davron Adminov',
  phone: '+998901110003',
  role: 'VENUE_ADMIN',
  isActive: true,
  lastLoginAt: null,
  // Ikkita stadion: bittasini olib tashlash mumkin.
  venueIds: ['v-1', 'v-2'],
};

const ADMIN_2 = {
  id: 'm-2',
  userId: 'u-4',
  fullName: 'Sanjar Adminov',
  phone: '+998901110004',
  role: 'VENUE_ADMIN',
  isActive: true,
  lastLoginAt: null,
  venueIds: ['v-2'],
};

let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers(xato?: { code: string; message: string }) {
  return [
    ...authedHandlers(DIRECTOR_ME),
    http.get(`${API}/members`, ({ request }) => {
      const url = new URL(request.url);
      const venueId = url.searchParams.get('venueId');
      // Backend filtri: stadion berilsa faqat biriktirilganlar qaytadi.
      const items =
        venueId === null
          ? [ADMIN_1, ADMIN_2]
          : [ADMIN_1, ADMIN_2].filter((m) => m.venueIds.includes(venueId));
      return HttpResponse.json({
        items,
        total: items.length,
        page: 1,
        pageSize: 100,
      });
    }),
    http.put(`${API}/members/:id/venues`, async ({ request, params }) => {
      yuborilgan.push({ url: String(params.id), body: await request.json() });
      if (xato) return HttpResponse.json(xato, { status: 409 });
      return HttpResponse.json({ userId: params.id, venueIds: [] });
    }),
  ];
}

beforeEach(() => {
  yuborilgan = [];
});

describe('Stadion adminlari', () => {
  it('shu stadionga biriktirilganlarni ko`rsatadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AdminsTab venueId="v-1" />);

    // Jadval ma'lumot kelgunicha ham chiziladi, shuning uchun kutish
    // AYNAN qator bo'yicha: `findByRole('table')` darrov qaytardi.
    expect(await screen.findByText('Davron Adminov')).toBeVisible();
    const jadval = within(screen.getByRole('table'));
    // Sanjar faqat v-2 da — bu ro'yxatda bo'lmasligi kerak.
    expect(jadval.queryByText('Sanjar Adminov')).toBeNull();
  });

  it('biriktirilmagan administratorni qo`shadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AdminsTab venueId="v-1" />);
    await screen.findByText('Davron Adminov');

    await userEvent.click(screen.getByRole('combobox', { name: 'Xodim' }));
    // Tanlash ro'yxatida faqat hali biriktirilmaganlar bo'ladi.
    expect(screen.queryByRole('option', { name: 'Davron Adminov' })).toBeNull();
    // antd variantini AYNAN `title` bo'yicha bosish kerak: `option`
    // roli o'ralgan elementda va uni bosish tanlovni o'zgartirmaydi.
    await userEvent.click(await screen.findByTitle('Sanjar Adminov'));
    await userEvent.click(screen.getByRole('button', { name: 'Biriktirish' }));

    await waitFor(() => expect(yuborilgan).toHaveLength(1));
    // Eski stadionlar saqlanadi, yangisi ustiga qo'shiladi.
    expect(yuborilgan[0]).toEqual({
      url: 'u-4',
      body: { venueIds: ['v-2', 'v-1'] },
    });
  });

  it('adminni olib tashlaganda faqat shu stadion ro`yxatdan chiqadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AdminsTab venueId="v-1" />);
    await screen.findByText('Davron Adminov');

    await userEvent.click(
      screen.getByRole('button', { name: 'Olib tashlash' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Ha' }));

    await waitFor(() => expect(yuborilgan).toHaveLength(1));
    expect(yuborilgan[0]).toEqual({
      url: 'u-3',
      body: { venueIds: ['v-2'] },
    });
  });

  it('oxirgi stadionni olib tashlashga urinishda backend xabari ko`rinadi', async () => {
    server.use(
      ...baseHandlers({
        code: 'MEMBER_VENUE_REQUIRED',
        message:
          "Administratorga kamida bitta stadion biriktirilishi shart.",
      }),
    );
    renderApp(<AdminsTab venueId="v-1" />);
    await screen.findByText('Davron Adminov');

    await userEvent.click(
      screen.getByRole('button', { name: 'Olib tashlash' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Ha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'kamida bitta stadion',
    );
  });
});
