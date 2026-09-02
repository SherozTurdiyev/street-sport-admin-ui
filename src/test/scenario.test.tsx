import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, anonHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

/**
 * 1-bosqichning to'liq zanjiri: login → menyu → xodim qo'shish →
 * vaqtinchalik parol → kartochka → lavozim → faolsizlantirish.
 *
 * Bu yerda alohida komponent emas, ILOVA sinaladi. Bo'g'inlarning har
 * biri o'z faylida ham qoplangan; bu test ular BIRGA ishlashini
 * tekshiradi — marshrut, ruxsat, kesh va xato yo'llari bilan birga.
 */

const DIREKTOR = {
  id: 'm-1',
  userId: 'u-1',
  fullName: 'Anvar Direktorov',
  phone: '+998901110001',
  role: 'DIRECTOR',
  isActive: true,
  lastLoginAt: null,
  venueIds: [],
};

const YANGI = {
  id: 'm-9',
  userId: 'u-9',
  fullName: 'Test Menejer',
  phone: '+998903517021',
  role: 'MANAGER',
  isActive: true,
  lastLoginAt: null,
  venueIds: [],
};

describe('1-bosqich: to`liq ssenariy', () => {
  it('direktor kiradi, xodim qo`shadi va uni boshqaradi', async () => {
    // Ro'yxat serverdagi holatga ergashadi: yaratilgach yangi xodim
    // jadvalda ko'rinishi kerak, bu esa kesh bekor qilinganini isbotlaydi.
    let members = [DIREKTOR];
    let isActive = true;

    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          accessToken: 'token',
          user: {
            id: 'u-1',
            fullName: 'Anvar Direktorov',
            phone: '+998901110001',
            orgId: 'o-1',
            role: 'DIRECTOR',
            mustChangePassword: false,
          },
        }),
      ),
      http.get(`${API}/auth/me`, () => HttpResponse.json(DIRECTOR_ME)),
      http.get(`${API}/members`, () =>
        HttpResponse.json({
          items: members,
          total: members.length,
          page: 1,
          pageSize: 20,
        }),
      ),
      http.post(`${API}/members`, () => {
        members = [DIREKTOR, YANGI];
        return HttpResponse.json(
          { member: YANGI, temporaryPassword: 'USNViPUQm5' },
          { status: 201 },
        );
      }),
      http.get(`${API}/members/u-9`, () =>
        HttpResponse.json({
          ...YANGI,
          isActive,
          stats: {
            bookingsCreated: 0,
            bookingsCancelled: 0,
            cashReceived: '0',
            shiftDiscrepancies: [],
          },
        }),
      ),
      http.post(`${API}/members/u-9/deactivate`, () => {
        isActive = false;
        return HttpResponse.json({ userId: 'u-9', isActive: false });
      }),
      http.get(`${API}/venues`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    // 1. Xodimlar sahifasiga bormoqchi — login sahifasiga tushadi.
    renderApp(<AppRouter />, { route: '/members' });
    await screen.findByRole('button', { name: /kirish/i });

    await userEvent.type(screen.getByLabelText('Telefon'), '901110001');
    await userEvent.type(screen.getByLabelText('Parol'), 'Parol123!');
    await userEvent.click(screen.getByRole('button', { name: /kirish/i }));

    // 2. Kirgach o'sha sahifaga qaytariladi va menyuda ruxsati bor
    //    bo'limlar turadi.
    expect(
      await screen.findByRole('button', { name: 'Anvar Direktorov' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Xodimlar' }),
    ).toBeInTheDocument();

    // 3. Yangi xodim qo'shiladi.
    await userEvent.click(screen.getByRole('button', { name: /Yangi xodim/ }));
    const oyna = within(await screen.findByRole('dialog'));
    await userEvent.type(
      oyna.getByLabelText('Ism va familiya'),
      'Test Menejer',
    );
    await userEvent.type(oyna.getByLabelText('Telefon'), '903517021');
    await userEvent.click(oyna.getByLabelText('Lavozim'));
    await userEvent.click(await screen.findByTitle('Menejer'));
    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    // 4. Vaqtinchalik parol ko'rsatiladi — bir martalik.
    expect(await screen.findByText('USNViPUQm5')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tushunarli' }));

    // 5. Yangi xodim ro'yxatda paydo bo'ldi: kesh bekor qilingan.
    const qator = await screen.findByRole('button', { name: 'Test Menejer' });

    // 6. Kartochka ochiladi va faolsizlantiriladi.
    await userEvent.click(qator);
    const karta = within(await screen.findByRole('dialog'));
    await userEvent.click(
      karta.getByRole('button', { name: 'Faolsizlantirish' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Ha' }));

    expect(
      await screen.findByText('Xodim faolsizlantirildi'),
    ).toBeInTheDocument();
    expect(
      await karta.findByRole('button', { name: 'Faollashtirish' }),
    ).toBeInTheDocument();
    // Bu suitedagi eng og'ir test: butun zanjirni bir o'tishda
    // bajaradi. Yolg'iz ~8 soniya, to'liq yuklamada esa undan ko'p —
    // shuning uchun umumiy chegara emas, o'z chegarasi.
  }, 30_000);
});
