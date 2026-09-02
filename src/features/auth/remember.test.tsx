import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  DIRECTOR_ME,
  anonHandlers,
  authedHandlers,
  dashboardHandlers,
} from '@/test/handlers';
import { setAccessToken } from '@/shared/api/token';
import { AppRouter } from '@/app/router';

const LOGIN_OK = {
  accessToken: 'token',
  user: {
    id: 'u-1',
    fullName: 'Anvar Direktorov',
    phone: '+998901110001',
    orgId: 'o-1',
    role: 'DIRECTOR',
    mustChangePassword: false,
  },
};

let chiqishlar = 0;

function logoutHandler() {
  return http.post(`${API}/auth/logout`, () => {
    chiqishlar += 1;
    return HttpResponse.json({ success: true });
  });
}

async function kirish(eslabQol: boolean): Promise<void> {
  await userEvent.type(screen.getByLabelText('Telefon'), '+998901110001');
  await userEvent.type(screen.getByLabelText('Parol'), 'Parol123!');
  // Belgi standart bo'yicha QO'YILGAN — maketdagidek.
  if (!eslabQol) {
    await userEvent.click(screen.getByRole('checkbox', { name: /eslab/i }));
  }
  await userEvent.click(screen.getByRole('button', { name: /kirish/i }));
}

beforeEach(() => {
  chiqishlar = 0;
  setAccessToken(null);
  localStorage.clear();
  sessionStorage.clear();
});

describe('«Meni eslab qol»', () => {
  it('belgilanmasa, brauzer qayta ochilganda sessiya yopiladi', async () => {
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () => HttpResponse.json(LOGIN_OK)),
      http.get(`${API}/auth/me`, () => HttpResponse.json(DIRECTOR_ME)),
      logoutHandler(),
      ...dashboardHandlers(),
    );
    const birinchi = renderApp(<AppRouter />, { route: '/login' });

    await screen.findByRole('button', { name: /kirish/i });
    await kirish(false);
    await screen.findByRole('heading', { name: 'Boshqaruv paneli' });

    // Brauzer yopildi: `sessionStorage` yo'qoladi, `localStorage` qoladi.
    birinchi.unmount();
    sessionStorage.clear();
    setAccessToken(null);

    // Ikkinchi ishga tushish. Refresh MUVAFFAQIYATLI bo'lardi —
    // cookie hali tirik. Foydalanuvchi buni istamagan.
    server.use(...authedHandlers(DIRECTOR_ME), logoutHandler());
    renderApp(<AppRouter />, { route: '/' });

    expect(
      await screen.findByRole('button', { name: /kirish/i }),
    ).toBeInTheDocument();
    expect(chiqishlar).toBe(1);
  });

  it('belgilangan bo`lsa, qayta ochilganda kirgan holda qoladi', async () => {
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () => HttpResponse.json(LOGIN_OK)),
      http.get(`${API}/auth/me`, () => HttpResponse.json(DIRECTOR_ME)),
      logoutHandler(),
      ...dashboardHandlers(),
    );
    const birinchi = renderApp(<AppRouter />, { route: '/login' });

    await screen.findByRole('button', { name: /kirish/i });
    await kirish(true);
    await screen.findByRole('heading', { name: 'Boshqaruv paneli' });

    birinchi.unmount();
    sessionStorage.clear();
    setAccessToken(null);

    server.use(...authedHandlers(DIRECTOR_ME), ...dashboardHandlers());
    renderApp(<AppRouter />, { route: '/' });

    expect(
      await screen.findByRole('heading', { name: 'Boshqaruv paneli' }),
    ).toBeInTheDocument();
    expect(chiqishlar).toBe(0);
  });
});
