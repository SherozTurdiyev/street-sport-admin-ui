import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, SUPER_ADMIN_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const STADION = {
  id: 'v-1',
  orgId: 'org-1',
  name: 'Chilonzor Arena',
  sportType: 'FOOTBALL_5X5',
  surface: 'ARTIFICIAL_GRASS',
  sizeLabel: '40x20',
  isIndoor: false,
  city: 'Toshkent',
  address: 'Chilonzor 5',
  latitude: null,
  longitude: null,
  contactPhone: '+998712000000',
  slotMinutes: 60,
  amenities: ['SHOWER'],
  photos: [],
  description: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  basePricePerHour: '150000',
  organization: { id: 'org-1', name: 'Neon Sports Group' },
};

const KARTOCHKA = {
  ...STADION,
  hours: [{ weekday: 1, opensAt: '08:00', closesAt: '23:00' }],
  closures: [
    {
      id: 'c-1',
      venueId: 'v-1',
      startsAt: '2026-09-10T05:00:00.000Z',
      endsAt: '2026-09-10T12:00:00.000Z',
      reason: 'Maydon ta’miri',
      createdBy: 'u-1',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ],
  priceRules: [
    {
      id: 'r-1',
      venueId: 'v-1',
      name: null,
      isBase: true,
      weekdays: [],
      startsTime: null,
      endsTime: null,
      pricePerHour: '150000',
      validFrom: null,
      validTo: null,
      priority: 0,
    },
  ],
};

let soralgan: URL[] = [];

function baseHandlers() {
  return [
    ...authedHandlers(SUPER_ADMIN_ME),
    http.get(`${API}/platform/venues`, ({ request }) => {
      soralgan.push(new URL(request.url));
      return HttpResponse.json({
        items: [STADION],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    }),
    http.get(`${API}/platform/venues/v-1`, () => HttpResponse.json(KARTOCHKA)),
  ];
}

describe('Platforma stadionlari', () => {
  it('yon panelda bo`lim bor va barcha stadionlarni ko`rsatadi', async () => {
    soralgan = [];
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/platform/venues' });

    expect(
      await screen.findByRole('menuitem', { name: 'Stadionlar' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Chilonzor Arena' }),
    ).toBeInTheDocument();
    // Kartochkada stadion KIMNIKI ekani ko'rinadi.
    expect(
      screen.getByRole('link', { name: 'Neon Sports Group' }),
    ).toHaveAttribute('href', '/platform/organizations/org-1');
  });

  it('filtr so`rovga tushadi', async () => {
    soralgan = [];
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/platform/venues' });
    await screen.findByRole('heading', { name: 'Chilonzor Arena' });

    await userEvent.type(screen.getByLabelText('Qidiruv'), 'Chilonzor{Enter}');

    expect(soralgan.at(-1)?.searchParams.get('search')).toBe('Chilonzor');
  });

  it('kartochkadan stadion sahifasi ochiladi', async () => {
    soralgan = [];
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/platform/venues' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Chilonzor Arena — ochish' }),
    );

    // Ish vaqti, narx va yopilish — direktordagi sahifadagi kabi.
    expect(
      await screen.findByRole('heading', { name: 'Chilonzor Arena', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('08:00 – 23:00')).toBeInTheDocument();
    expect(screen.getByText("150 000 so'm/soat")).toBeInTheDocument();

    const yopilishlar = screen.getByRole('tab', { name: 'Yopilishlar' });
    await userEvent.click(yopilishlar);
    expect(await screen.findByText('Maydon ta’miri')).toBeInTheDocument();
  });

  it('ish ma`lumoti yo`qligini ochiq aytadi va tahrirlash tugmasi yo`q', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/platform/venues/v-1' });

    expect(
      await screen.findByText(/Bronlar va tushum bu yerda ko/),
    ).toBeInTheDocument();
    // Sahifa faqat o'qish uchun.
    expect(
      screen.queryByRole('button', { name: 'Tahrirlash' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Arxivlash' }),
    ).not.toBeInTheDocument();
  });

  it('sarlavhadagi yo`lakcha stadion nomini ko`rsatadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/platform/venues/v-1' });

    const banner = within(await screen.findByRole('banner'));
    expect(await banner.findByText('Chilonzor Arena')).toBeInTheDocument();
    expect(banner.getByRole('link', { name: 'Stadionlar' })).toHaveAttribute(
      'href',
      '/platform/venues',
    );
  });
});
