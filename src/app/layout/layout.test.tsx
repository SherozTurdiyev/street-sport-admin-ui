import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { ADMIN_ME, API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const ORG = {
  id: 'o-1',
  name: 'Chilonzor Arena MCHJ',
  logoUrl: null,
  phone: null,
  address: null,
  timezone: 'Asia/Tashkent',
  currency: 'UZS',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndsAt: null,
  createdAt: '2026-08-25T12:54:16.392Z',
  updatedAt: '2026-08-25T12:54:16.392Z',
};

function orgHandler() {
  return http.get(`${API}/organizations/current`, () => HttpResponse.json(ORG));
}

describe('Menyu ruxsat bo`yicha yig`iladi', () => {
  it('administratorda "Xodimlar" bo`limi ko`rinmaydi', async () => {
    server.use(...authedHandlers(ADMIN_ME), orgHandler());
    renderApp(<AppRouter />, { route: '/organization' });

    expect(
      await screen.findByRole('menuitem', { name: 'Tashkilot' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Xodimlar' }),
    ).not.toBeInTheDocument();
  });

  it('direktor ikkala bo`limni ham ko`radi', async () => {
    server.use(...authedHandlers(DIRECTOR_ME), orgHandler());
    renderApp(<AppRouter />, { route: '/organization' });

    expect(
      await screen.findByRole('menuitem', { name: 'Xodimlar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Tashkilot' }),
    ).toBeInTheDocument();
  });
});

describe('Ruxsatsiz bo`limga qo`lda kirish', () => {
  it('administratorga "ruxsat yo`q" sahifasi chiqadi', async () => {
    server.use(...authedHandlers(ADMIN_ME), orgHandler());
    renderApp(<AppRouter />, { route: '/members' });

    expect(await screen.findByText("Ruxsat yo'q")).toBeInTheDocument();
    // Ro'yxatning o'zi umuman yuklanmaydi.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
