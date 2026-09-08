import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  SUPER_ADMIN_ME,
  authedHandlers,
  platformDashboardHandlers,
} from '@/test/handlers';
import { AppRouter } from '@/app/router';

const ROOT = `${API}/platform/organizations`;

const DIREKTOR = {
  userId: 'u-1',
  fullName: 'Anvar Direktorov',
  phone: '+998901110001',
  isActive: true,
};

const TASHKILOT = {
  id: 'org-1',
  name: 'Neon Sports Group',
  logoUrl: null,
  phone: null,
  address: null,
  timezone: 'Asia/Tashkent',
  currency: 'UZS',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndsAt: '2027-01-01T00:00:00.000Z',
  blockReason: null,
  blockedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  effectiveStatus: 'ACTIVE',
  isBlocked: false,
  stats: {
    venueCount: 1,
    memberCount: 2,
    bookingCount: 0,
    lastActivityAt: null,
  },
  directors: [DIREKTOR],
};

describe('Direktor parolini tiklash', () => {
  beforeEach(() => {
    server.use(
      ...authedHandlers(SUPER_ADMIN_ME),
      ...platformDashboardHandlers(),
      http.get(`${ROOT}/org-1`, () => HttpResponse.json(TASHKILOT)),
      http.get(`${ROOT}/org-1/members`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
      ),
      http.get(`${ROOT}/org-1/venues`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
      ),
    );
  });

  it('tiklangan parolni bir marta ko’rsatadi', async () => {
    let chaqirildi = false;
    server.use(
      http.post(`${ROOT}/org-1/directors/u-1/reset-password`, () => {
        chaqirildi = true;
        return HttpResponse.json({ temporaryPassword: 'u3usvaXZh3' });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/organizations/org-1' });

    await user.click(
      await screen.findByRole('button', { name: 'Parolni tiklash' }),
    );

    // Tasdiqsiz bajarilmasligi kerak: bu direktorni tizimdan
    // chiqarib yuboradigan amal.
    const tasdiq = await screen.findByRole('dialog');
    expect(chaqirildi).toBe(false);
    await user.click(within(tasdiq).getByRole('button', { name: /Tiklash/ }));

    expect(await screen.findByText('u3usvaXZh3')).toBeInTheDocument();
    expect(chaqirildi).toBe(true);
  });

  it('xatoni ko’rsatadi va parol o’rnini bo’sh qoldirmaydi', async () => {
    server.use(
      http.post(`${ROOT}/org-1/directors/u-1/reset-password`, () =>
        HttpResponse.json(
          { code: 'MEMBER_NOT_FOUND', message: 'Xodim topilmadi.' },
          { status: 404 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/organizations/org-1' });

    await user.click(
      await screen.findByRole('button', { name: 'Parolni tiklash' }),
    );
    const tasdiq = await screen.findByRole('dialog');
    await user.click(within(tasdiq).getByRole('button', { name: /Tiklash/ }));

    expect(await screen.findByText('Xodim topilmadi.')).toBeInTheDocument();
  });
});
