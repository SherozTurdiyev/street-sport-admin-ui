import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  DIRECTOR_ME,
  SUPER_ADMIN_ME,
  authedHandlers,
  dashboardHandlers,
  platformDashboardHandlers,
} from '@/test/handlers';
import { AppRouter } from '@/app/router';

const ROOT = `${API}/platform/demo-requests`;

const YANGI = {
  id: 'dr-1',
  fullName: 'Alisher Karimov',
  phone: '+998939542111',
  venueCount: 2,
  city: 'Toshkent',
  comment: 'Ikki maydonim bor, ko‘rmoqchiman.',
  status: 'NEW',
  note: null,
  handledBy: null,
  handledAt: null,
  createdAt: '2026-09-07T10:00:00.000Z',
};

const BOGLANILGAN = {
  ...YANGI,
  id: 'dr-2',
  fullName: 'Bobur Aliyev',
  phone: '+998901112233',
  venueCount: null,
  city: null,
  comment: null,
  status: 'CONTACTED',
  note: 'Ertaga qayta qo‘ng‘iroq',
  handledBy: 'u-0',
  handledAt: '2026-09-07T12:00:00.000Z',
  createdAt: '2026-09-06T10:00:00.000Z',
};

/**
 * Backend `status` bo'yicha filtrlaydi, shuning uchun soxta handler ham
 * shunday qiladi: menyudagi belgi aynan `status=NEW` bilan so'raydi va
 * filtrsiz handler unga butun ro'yxat sonini qaytarib, belgi noto'g'ri
 * chiqardi.
 */
function royxat(items: { status: string }[]) {
  return http.get(ROOT, ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    const mos =
      status === null ? items : items.filter((x) => x.status === status);
    return HttpResponse.json({
      items: mos,
      total: mos.length,
      page: 1,
      pageSize: 20,
    });
  });
}

describe('Murojaatlar sahifasi', () => {
  beforeEach(() => {
    server.use(
      // Ro'yxat handleri `authedHandlers` dagi umumiy javobdan OLDIN
      // turishi kerak: MSW birinchi mos kelganini ishlatadi. Aks holda
      // menyudagi belgi uchun qo'yilgan bo'sh javob g'olib chiqardi.
      royxat([YANGI, BOGLANILGAN]),
      ...authedHandlers(SUPER_ADMIN_ME),
      ...platformDashboardHandlers(),
    );
  });

  it('murojaatlarni ro‘yxatda ko‘rsatadi', async () => {
    renderApp(<AppRouter />, { route: '/platform/demo-requests' });

    expect(await screen.findByText('Alisher Karimov')).toBeInTheDocument();
    expect(screen.getByText('Bobur Aliyev')).toBeInTheDocument();
    // Telefon bosiladigan bo'lishi kerak: xodim bosib qo'ng'iroq
    // qiladi, raqamni qo'lda ko'chirmaydi.
    expect(
      screen.getByRole('link', { name: '+998 (93) 954-21-11' }),
    ).toHaveAttribute('href', 'tel:+998939542111');
  });

  it('holat bo‘yicha filtrlaydi', async () => {
    const sorovlar: string[] = [];
    server.use(
      http.get(ROOT, ({ request }) => {
        sorovlar.push(new URL(request.url).searchParams.get('status') ?? '');
        return HttpResponse.json({
          items: [YANGI],
          total: 1,
          page: 1,
          pageSize: 20,
        });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/demo-requests' });
    await screen.findByText('Alisher Karimov');

    await user.click(screen.getByLabelText('Holat'));
    await user.click(await screen.findByTitle('Yangi'));

    // Filtr so'rovga tushishi SHART — aks holda ro'yxat o'zgarmaydi
    // va xodim filtr ishlamayapti deb o'ylaydi.
    await screen.findByText('Alisher Karimov');
    expect(sorovlar).toContain('NEW');
  });

  it('holatni o‘zgartiradi va izoh yozadi', async () => {
    let yuborilgan: unknown = null;
    server.use(
      http.patch(`${ROOT}/dr-1`, async ({ request }) => {
        yuborilgan = await request.json();
        return HttpResponse.json({
          ...YANGI,
          status: 'CONTACTED',
          note: 'Qo‘ng‘iroq qilindi',
        });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/demo-requests' });

    await user.click(await screen.findByText('Alisher Karimov'));
    const oyna = await screen.findByRole('dialog');

    await user.click(within(oyna).getByLabelText('Holat'));
    await user.click(await screen.findByTitle('Bog‘lanildi'));
    await user.type(
      within(oyna).getByLabelText('Ichki izoh'),
      'Qo‘ng‘iroq qilindi',
    );
    await user.click(within(oyna).getByRole('button', { name: 'Saqlash' }));

    await screen.findByText('Murojaat yangilandi');
    expect(yuborilgan).toEqual({
      status: 'CONTACTED',
      note: 'Qo‘ng‘iroq qilindi',
    });
  });

  it('to‘liq izohni oynada ko‘rsatadi', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/demo-requests' });

    await user.click(await screen.findByText('Alisher Karimov'));
    const oyna = await screen.findByRole('dialog');
    expect(
      within(oyna).getByText('Ikki maydonim bor, ko‘rmoqchiman.'),
    ).toBeInTheDocument();
  });

  it('menyuda yangi murojaatlar soni ko‘rinadi', async () => {
    renderApp(<AppRouter />, { route: '/dashboard' });

    // Belgi bo'lmasa xodim sahifani ochishni unutadi va mijoz
    // kutib qoladi.
    const menyu = await screen.findByRole('link', { name: /Murojaatlar/ });
    expect(menyu).toBeInTheDocument();
    expect(await screen.findByTitle('1 ta yangi murojaat')).toBeInTheDocument();
  });

  it('direktor bo‘limni ko‘rmaydi', async () => {
    server.use(...authedHandlers(DIRECTOR_ME), ...dashboardHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });

    await screen.findByRole('link', { name: /Boshqaruv paneli/ });
    expect(
      screen.queryByRole('link', { name: /Murojaatlar/ }),
    ).not.toBeInTheDocument();
  });
});
