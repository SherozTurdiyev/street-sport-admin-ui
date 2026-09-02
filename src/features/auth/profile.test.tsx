import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

function baseHandlers() {
  return [
    ...authedHandlers(DIRECTOR_ME),
    http.get(`${API}/organizations/current`, () =>
      HttpResponse.json({
        id: 'o-1',
        name: 'Neon Sports Group',
        logoUrl: null,
        phone: null,
        address: null,
        timezone: 'Asia/Tashkent',
        currency: 'UZS',
        subscriptionStatus: 'ACTIVE',
        subscriptionEndsAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ),
  ];
}

describe('Profil', () => {
  it('sarlavhada parol tugmasi YO`Q', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/' });

    await screen.findByRole('menuitem', { name: 'Tashkilot' });
    expect(
      screen.queryByRole('button', { name: /Parolni almashtirish/i }),
    ).not.toBeInTheDocument();
  });

  it('yon paneldagi ism profilga olib boradi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/' });

    await userEvent.click(
      await screen.findByRole('link', { name: /Anvar Direktorov/ }),
    );

    // Endi bu maydonlar tahrirlanadi — matn emas, forma qiymati.
    expect(await screen.findByLabelText('Ism va familiya')).toHaveValue(
      'Anvar Direktorov',
    );
    expect(screen.getByLabelText('Telefon')).toHaveValue('+998901110001');
  });

  it('ism va telefonni saqlaydi', async () => {
    let yuborilgan: unknown = null;
    server.use(
      ...baseHandlers(),
      http.patch(`${API}/auth/me`, async ({ request }) => {
        yuborilgan = await request.json();
        return HttpResponse.json({
          ...DIRECTOR_ME,
          fullName: 'Anvar Yangi',
          phone: '+998901119999',
        });
      }),
    );
    renderApp(<AppRouter />, { route: '/profile' });

    const ism = await screen.findByLabelText('Ism va familiya');
    await userEvent.clear(ism);
    await userEvent.type(ism, 'Anvar Yangi');
    const tel = screen.getByLabelText('Telefon');
    await userEvent.clear(tel);
    await userEvent.type(tel, '+998901119999');
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText(/saqlandi/i)).toBeInTheDocument();
    expect(yuborilgan).toEqual({
      fullName: 'Anvar Yangi',
      phone: '+998901119999',
    });

    // Javob `me` bilan bir xil, shuning uchun yon paneldagi ism ham
    // qo'shimcha so'rovsiz yangilanadi.
    expect(
      await screen.findByRole('link', { name: /Anvar Yangi/ }),
    ).toBeInTheDocument();
  });

  it('profildan parol almashtiriladi', async () => {
    let yuborilgan: unknown = null;
    server.use(
      ...baseHandlers(),
      http.post(`${API}/auth/change-password`, async ({ request }) => {
        yuborilgan = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp(<AppRouter />, { route: '/profile' });

    const xavfsizlik = within(
      (await screen.findByText('Xavfsizlik')).closest(
        '.ant-card',
      ) as HTMLElement,
    );
    await userEvent.type(xavfsizlik.getByLabelText('Joriy parol'), 'Eski123!');
    await userEvent.type(xavfsizlik.getByLabelText('Yangi parol'), 'Yangi123!');
    await userEvent.type(
      xavfsizlik.getByLabelText('Yangi parolni takrorlang'),
      'Yangi123!',
    );
    await userEvent.click(
      xavfsizlik.getByRole('button', { name: 'Parolni yangilash' }),
    );

    // Parol almashgach barcha sessiyalar yopiladi — buni aytish shart.
    expect(
      await screen.findByText(/barcha qurilmalardagi sessiyalar yopildi/i),
    ).toBeInTheDocument();
    expect(yuborilgan).toEqual({
      currentPassword: 'Eski123!',
      newPassword: 'Yangi123!',
    });
  });
});
