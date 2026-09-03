import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  SUPER_ADMIN_ME,
  authedHandlers,
  platformDashboardHandlers,
} from '@/test/handlers';
import { AppRouter } from '@/app/router';

/**
 * Platforma xodimi hech qaysi tashkilotga tegishli emas. "Tashkilot"
 * bo'limi unga ochiq bo'lsa, sahifa `/organizations/current` ga boradi va
 * backend haqli ravishda `NOT_FOUND` qaytaradi.
 *
 * Bu yerda mock qilinmagan har qanday so'rov testni yiqitadi
 * (`onUnhandledRequest: 'error'`), shuning uchun so'rovning KETMAGANI
 * ham shu testlar bilan isbotlanadi.
 */
function platformHandlers() {
  return [
    ...authedHandlers(SUPER_ADMIN_ME),
    ...platformDashboardHandlers(),
    http.get(`${API}/platform/organizations`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
    ),
  ];
}

describe('Tashkilotsiz foydalanuvchi', () => {
  it('tashkilot bo`limini ko`rmaydi, platforma bo`limini ko`radi', async () => {
    server.use(...platformHandlers());
    renderApp(<AppRouter />, { route: '/' });

    expect(
      await screen.findByRole('menuitem', { name: 'Tashkilotlar' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Tashkilot' }),
    ).not.toBeInTheDocument();
  });

  it('tashkilot manzilini qo`lda yozib ham kira olmaydi', async () => {
    server.use(...platformHandlers());
    renderApp(<AppRouter />, { route: '/organization' });

    expect(await screen.findByText(/Sizga ochiq/i)).toBeInTheDocument();
  });

  it('birorta bo`limi yo`q hisobga holatni tushuntiradi', async () => {
    // Tashkiloti ham, ruxsati ham yo'q hisob: masalan platforma
    // ruxsatlari kelajakda bo'linsa shunday holat paydo bo'ladi.
    server.use(...authedHandlers({ ...SUPER_ADMIN_ME, permissions: [] }));
    renderApp(<AppRouter />, { route: '/' });

    expect(await screen.findByText(/Sizga ochiq/i)).toBeInTheDocument();
  });
});
