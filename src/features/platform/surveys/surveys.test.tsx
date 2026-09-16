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

const ROOT = `${API}/platform/surveys`;

const FAOL = {
  id: 's-1',
  title: 'Mijozlar fikri',
  isActive: true,
  responseCount: 3,
  createdAt: '2026-09-16T10:00:00.000Z',
  updatedAt: '2026-09-16T10:00:00.000Z',
};
const QORALAMA = {
  ...FAOL,
  id: 's-2',
  title: 'Narxlar haqida',
  isActive: false,
  responseCount: 0,
};

const royxat = (items: object[]) =>
  http.get(ROOT, () =>
    HttpResponse.json({ items, total: items.length, page: 1, pageSize: 20 }),
  );

function qator(nom: string): HTMLElement {
  const row = screen.getByText(nom).closest('tr');
  if (!row) throw new Error(`${nom} qatori topilmadi`);
  return row;
}

describe('So‘rovnomalar ro‘yxati', () => {
  beforeEach(() => {
    server.use(
      royxat([FAOL, QORALAMA]),
      ...authedHandlers(SUPER_ADMIN_ME),
      ...platformDashboardHandlers(),
    );
  });

  it('holat va javoblar sonini ko‘rsatadi', async () => {
    renderApp(<AppRouter />, { route: '/platform/surveys' });

    expect(await screen.findByText('Mijozlar fikri')).toBeInTheDocument();
    expect(
      within(qator('Mijozlar fikri')).getByText('Faol'),
    ).toBeInTheDocument();
    expect(
      within(qator('Narxlar haqida')).getByText('Nofaol'),
    ).toBeInTheDocument();
    expect(within(qator('Mijozlar fikri')).getByText('3')).toBeInTheDocument();
  });

  it('javobi bor so‘rovnomada o‘chirish tugmasi o‘chiq', async () => {
    renderApp(<AppRouter />, { route: '/platform/surveys' });
    await screen.findByText('Mijozlar fikri');

    expect(
      within(qator('Mijozlar fikri')).getByRole('button', {
        name: /O‘chirish/,
      }),
    ).toBeDisabled();
    expect(
      within(qator('Narxlar haqida')).getByRole('button', {
        name: /O‘chirish/,
      }),
    ).toBeEnabled();
  });

  it('faollashtirishda eskisi to‘xtatilishini ogohlantiradi', async () => {
    let chaqirildi = '';
    server.use(
      http.post(`${ROOT}/:id/activate`, ({ params }) => {
        chaqirildi = String(params.id);
        return HttpResponse.json({ ...QORALAMA, isActive: true });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys' });
    await screen.findByText('Narxlar haqida');

    await user.click(
      within(qator('Narxlar haqida')).getByRole('button', {
        name: /Faollashtirish/,
      }),
    );
    expect(
      await screen.findByText('«Mijozlar fikri» to‘xtatiladi. Davom etasizmi?'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ha' }));

    await expect.poll(() => chaqirildi).toBe('s-2');
  });

  it('menyuda “So‘rovnomalar” bandi bor', async () => {
    renderApp(<AppRouter />, { route: '/platform/surveys' });
    expect(
      await screen.findByRole('menuitem', { name: /So‘rovnomalar/ }),
    ).toBeInTheDocument();
  });
});
