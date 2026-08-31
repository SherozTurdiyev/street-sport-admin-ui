import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const ITEMS = [
  {
    id: 'm-1',
    userId: 'u-1',
    fullName: 'Anvar Direktorov',
    phone: '+998901110001',
    role: 'DIRECTOR',
    isActive: true,
    lastLoginAt: '2026-08-27T04:19:10.373Z',
    venueIds: [],
  },
  {
    id: 'm-2',
    userId: 'u-2',
    fullName: 'Dilnoza Menejerova',
    phone: '+998901110002',
    role: 'MANAGER',
    isActive: false,
    lastLoginAt: null,
    venueIds: [],
  },
];

let requests: URL[] = [];

function membersHandler() {
  return http.get(`${API}/members`, ({ request }) => {
    const url = new URL(request.url);
    requests.push(url);
    return HttpResponse.json({
      items: ITEMS,
      total: 45,
      page: Number(url.searchParams.get('page') ?? '1'),
      pageSize: 20,
    });
  });
}

/**
 * Jadval ichida qidiriladi: sarlavhada ham kirgan foydalanuvchining ismi
 * turadi va u tasodifan mos kelishi mumkin.
 */
async function table(): Promise<HTMLElement> {
  return await screen.findByRole('table');
}

function last(): URL {
  const url = requests.at(-1);
  if (!url) throw new Error("Hech qanday so'rov ketmadi");
  return url;
}

beforeEach(() => {
  requests = [];
  server.use(...authedHandlers(DIRECTOR_ME), membersHandler());
});

describe('Xodimlar ro`yxati', () => {
  it('ro`yxatni ko`rsatadi va ikkinchi sahifani so`raydi', async () => {
    renderApp(<AppRouter />, { route: '/members' });

    const rows = within(await table());
    expect(await rows.findByText('Anvar Direktorov')).toBeInTheDocument();
    expect(rows.getByText('Dilnoza Menejerova')).toBeInTheDocument();
    // Rol faqat ekranda ko'rsatiladi — o'zbekcha nomi bilan.
    expect(rows.getByText('Direktor')).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('2'));

    await waitFor(() => expect(last().searchParams.get('page')).toBe('2'));
  });

  it('filtr o`zgarsa sahifa 1 ga qaytadi', async () => {
    renderApp(<AppRouter />, { route: '/members' });
    await within(await table()).findByText('Anvar Direktorov');

    await userEvent.click(screen.getByTitle('2'));
    await waitFor(() => expect(last().searchParams.get('page')).toBe('2'));

    await userEvent.type(screen.getByLabelText('Qidiruv'), 'Dilnoza{Enter}');

    await waitFor(() => {
      expect(last().searchParams.get('search')).toBe('Dilnoza');
      // 5-sahifada qolish klassik xato: natija 2 ta bo'lsa foydalanuvchi
      // bo'sh jadval ko'radi va sababini tushunmaydi.
      expect(last().searchParams.get('page')).toBe('1');
    });
  });
});
