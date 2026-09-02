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

function membersHandler() {
  return http.get(`${API}/members`, () =>
    HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
  );
}

function organizationHandler() {
  return http.get(`${API}/organizations/current`, () =>
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
  );
}

async function kirish() {
  await userEvent.type(screen.getByLabelText('Telefon'), '+998901110001');
  await userEvent.type(screen.getByLabelText('Parol'), 'Parol123!');
  await userEvent.click(screen.getByRole('button', { name: 'Kirish' }));
}

beforeEach(() => {
  setAccessToken(null);
});

describe('Logindan keyingi yo`nalish', () => {
  it('foydalanuvchi bormoqchi bo`lgan sahifaga qaytaradi', async () => {
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () => HttpResponse.json(LOGIN_OK)),
      http.get(`${API}/auth/me`, () => HttpResponse.json(DIRECTOR_ME)),
      membersHandler(),
    );
    // `/members` ga kirmoqchi bo'ldi, lekin login sahifasiga tushdi.
    renderApp(<AppRouter />, { route: '/members' });

    await screen.findByRole('button', { name: 'Kirish' });
    await kirish();

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Kirish' }),
    ).not.toBeInTheDocument();
  });

  it('to`g`ridan-to`g`ri kirganda bosh sahifaga o`tadi', async () => {
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () => HttpResponse.json(LOGIN_OK)),
      http.get(`${API}/auth/me`, () => HttpResponse.json(DIRECTOR_ME)),
      membersHandler(),
      organizationHandler(),
      ...dashboardHandlers(),
    );
    renderApp(<AppRouter />, { route: '/login' });

    await screen.findByRole('button', { name: 'Kirish' });
    await kirish();

    expect(
      await screen.findByRole('menuitem', { name: 'Xodimlar' }),
    ).toBeInTheDocument();
  });

  it('parol almashtirish sahifasiga QAYTARMAYDI', async () => {
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () => HttpResponse.json(LOGIN_OK)),
      http.get(`${API}/auth/me`, () => HttpResponse.json(DIRECTOR_ME)),
      membersHandler(),
      organizationHandler(),
      ...dashboardHandlers(),
    );
    // Parol almashgach backend barcha sessiyalarni yopadi va foydalanuvchi
    // aynan shu sahifada turib login sahifasiga tushadi. U bu yerga o'zi
    // bormagan — qaytarilishi kerak bo'lgan manzil emas.
    renderApp(<AppRouter />, { route: '/change-password' });

    await screen.findByRole('button', { name: 'Kirish' });
    await kirish();

    // Bosh sahifaga tushadi — ya'ni birinchi ochiq bo'lim, ya'ni
    // boshqaruv paneli.
    expect(
      await screen.findByRole('heading', { name: 'Boshqaruv paneli' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Joriy parol')).not.toBeInTheDocument();
  });

  it('kirgan foydalanuvchiga login formasi ko`rsatilmaydi', async () => {
    server.use(
      ...authedHandlers(DIRECTOR_ME),
      membersHandler(),
      organizationHandler(),
      ...dashboardHandlers(),
    );
    renderApp(<AppRouter />, { route: '/login' });

    expect(
      await screen.findByRole('menuitem', { name: 'Xodimlar' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Kirish' }),
    ).not.toBeInTheDocument();
  });
});
