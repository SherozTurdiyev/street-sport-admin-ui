import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, ADMIN_ME, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { OrganizationPage } from './OrganizationPage';

const TASHKILOT = {
  id: 'o-1',
  name: 'Noventer MCHJ',
  logoUrl: null,
  phone: '+998901110001',
  address: 'Toshkent',
  timezone: 'Asia/Tashkent',
  currency: 'UZS',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndsAt: null,
  cashMismatchThreshold: '5000',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

let yuborilgan: unknown[] = [];

function baseHandlers(me: object = DIRECTOR_ME) {
  return [
    ...authedHandlers(me),
    http.get(`${API}/organizations/current`, () =>
      HttpResponse.json(TASHKILOT),
    ),
    http.patch(`${API}/organizations/current`, async ({ request }) => {
      yuborilgan.push(await request.json());
      return HttpResponse.json({ ...TASHKILOT, cashMismatchThreshold: '7000' });
    }),
  ];
}

beforeEach(() => {
  yuborilgan = [];
});

describe('Kassa farqi chegarasi (F12.3)', () => {
  it('chegarani SATR ko`rinishida yuboradi', async () => {
    server.use(...baseHandlers());
    renderApp(<OrganizationPage />);

    const maydon = await screen.findByLabelText('Kassa farqi chegarasi');
    // Maskali ko'rinish: serverdagi `5000` shunday chiziladi.
    expect(maydon).toHaveValue('5 000');

    await userEvent.clear(maydon);
    await userEvent.type(maydon, '7000');
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    // Son EMAS, satr: 7000 emas, '7000' (BR-13).
    await waitFor(() =>
      expect(yuborilgan).toEqual([{ cashMismatchThreshold: '7000' }]),
    );
  });

  it('ruxsat yo`q bo`lsa faqat o`qish uchun ko`rinadi', async () => {
    server.use(...baseHandlers(ADMIN_ME));
    renderApp(<OrganizationPage />);

    expect(await screen.findByText("5 000 so'm")).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Saqlash' })).toBeNull();
  });
});
