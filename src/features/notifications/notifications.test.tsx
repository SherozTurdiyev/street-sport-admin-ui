import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  DIRECTOR_ME,
  SUPER_ADMIN_ME,
  authedHandlers,
  dashboardHandlers,
} from '@/test/handlers';
import { AppRouter } from '@/app/router';
import { Route, Routes } from 'react-router';
import { NotificationsBell } from '@/app/layout/NotificationsBell';

const XABARLAR = [
  {
    id: 'n-1',
    type: 'shift.cash_mismatch',
    title: 'Kassada farq chiqdi',
    body: 'Chilonzor Arena — 50 000 so‘m kam chiqdi.',
    payload: { shiftId: 's-1' },
    readAt: null,
    createdAt: '2026-09-05T04:00:00.000Z',
  },
  {
    id: 'n-2',
    type: 'series.expiring',
    title: 'Doimiy mijoz jadvali tugayapti',
    body: 'Alisher Rahimov — jadval 12.09.2026 da tugaydi.',
    payload: { seriesId: 'x-1' },
    readAt: '2026-09-04T10:00:00.000Z',
    createdAt: '2026-09-04T09:00:00.000Z',
  },
];

let soralgan: URL[] = [];
let belgilangan: string[] = [];

function baseHandlers(me: object = DIRECTOR_ME, items = XABARLAR) {
  const unreadCount = items.filter((x) => x.readAt === null).length;
  return [
    // Qo'ng'iroqcha handleri umumiy ro'yxatdagidan OLDIN turishi kerak:
    // MSW birinchi mos kelganini ishlatadi.
    http.get(`${API}/notifications`, ({ request }) => {
      soralgan.push(new URL(request.url));
      return HttpResponse.json({
        items,
        total: items.length,
        page: 1,
        pageSize: 10,
        unreadCount,
      });
    }),
    http.patch(`${API}/notifications/:id/read`, ({ params }) => {
      belgilangan.push(String(params.id));
      return HttpResponse.json({ unreadCount: unreadCount - 1 });
    }),
    http.post(`${API}/notifications/read-all`, () => {
      belgilangan.push('all');
      return HttpResponse.json({ unreadCount: 0 });
    }),
    ...authedHandlers(me),
    ...dashboardHandlers(),
  ];
}

const qongiroq = () =>
  screen.findByRole('button', { name: /Bildirishnomalar/ });

beforeEach(() => {
  soralgan = [];
  belgilangan = [];
});

describe('Bildirishnomalar qo`ng`irog`i', () => {
  it('o`qilmaganlar sonini ko`rsatadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });

    const tugma = await qongiroq();
    await waitFor(() =>
      expect(tugma).toHaveAccessibleName(/1 ta yangi bildirishnoma/),
    );
  });

  it('ro`yxatni ochadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });

    await userEvent.click(await qongiroq());

    expect(await screen.findByText('Kassada farq chiqdi')).toBeVisible();
    expect(
      screen.getByText('Doimiy mijoz jadvali tugayapti'),
    ).toBeVisible();
  });

  it('xabar bosilganda o`qilgan deb belgilanadi va sahifa ochiladi', async () => {
    server.use(...baseHandlers());
    // Butun ilova o'rniga qo'ng'iroqcha va bitta zond marshruti: bu
    // test o'tishning O'ZINI tekshiradi, smenalar sahifasini emas.
    renderApp(
      <>
        <NotificationsBell />
        <Routes>
          <Route path="/shifts" element={<div>SMENA SAHIFASI</div>} />
          <Route path="*" element={<div>BOSHQA</div>} />
        </Routes>
      </>,
    );
    await userEvent.click(await qongiroq());

    await userEvent.click(await screen.findByText('Kassada farq chiqdi'));

    await waitFor(() => expect(belgilangan).toEqual(['n-1']));
    // `shift.cash_mismatch` — smenalar ro'yxatiga.
    expect(await screen.findByText('SMENA SAHIFASI')).toBeVisible();
  });

  it('o`qilgan xabar qayta belgilanmaydi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });
    await userEvent.click(await qongiroq());

    await userEvent.click(
      await screen.findByText('Doimiy mijoz jadvali tugayapti'),
    );

    expect(belgilangan).toEqual([]);
  });

  it('hammasini o`qildi deb belgilaydi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/dashboard' });
    await userEvent.click(await qongiroq());

    await userEvent.click(
      await screen.findByRole('button', { name: /Hammasini o.qildi/ }),
    );

    await waitFor(() => expect(belgilangan).toEqual(['all']));
  });

  it('xabar yo`q bo`lsa buni aytadi va tugma bo`sh belgisiz turadi', async () => {
    server.use(...baseHandlers(DIRECTOR_ME, []));
    renderApp(<AppRouter />, { route: '/dashboard' });

    const tugma = await qongiroq();
    expect(tugma).toHaveAccessibleName(/Bildirishnoma yo/);

    await userEvent.click(tugma);
    expect(await screen.findByText('Hozircha xabar yo‘q')).toBeVisible();
  });

  it('tashkilotsiz foydalanuvchi uchun so`rov umuman ketmaydi', async () => {
    // Platforma xodimida `orgId` yo'q — server so'rovni haqli ravishda
    // rad etardi, shuning uchun so'ralmaydi ham.
    server.use(...baseHandlers(SUPER_ADMIN_ME));
    renderApp(<AppRouter />, { route: '/dashboard' });

    await qongiroq();
    await waitFor(() => expect(soralgan).toHaveLength(0));
  });
});
