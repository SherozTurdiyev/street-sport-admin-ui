import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { SUPER_ADMIN_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

/**
 * Platforma xodimi hech qaysi tashkilotga tegishli emas. "Tashkilot"
 * bo'limi unga ochiq bo'lsa, sahifa `/organizations/current` ga boradi va
 * backend haqli ravishda `NOT_FOUND` qaytaradi — foydalanuvchi esa
 * o'zini nima noto'g'ri qilganini tushunmaydi.
 *
 * Bu yerda mock qilinmagan har qanday so'rov testni yiqitadi
 * (`onUnhandledRequest: 'error'`), shuning uchun so'rovning KETMAGANI
 * ham shu testlar bilan isbotlanadi.
 */
describe('Tashkilotsiz foydalanuvchi', () => {
  it('"Tashkilot" bo`limini ko`rmaydi', async () => {
    server.use(...authedHandlers(SUPER_ADMIN_ME));
    renderApp(<AppRouter />, { route: '/' });

    expect(await screen.findByText(/Sizga ochiq/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Tashkilot' }),
    ).not.toBeInTheDocument();
  });

  it('manzilni qo`lda yozib ham kira olmaydi', async () => {
    server.use(...authedHandlers(SUPER_ADMIN_ME));
    renderApp(<AppRouter />, { route: '/organization' });

    expect(await screen.findByText(/Sizga ochiq/i)).toBeInTheDocument();
  });
});
