import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const DIREKTOR = {
  id: 'm-1',
  userId: 'u-1',
  fullName: 'Anvar Direktorov',
  phone: '+998901110001',
  role: 'DIRECTOR',
  isActive: true,
  lastLoginAt: null,
  venueIds: [],
};

const YARATILDI = {
  member: {
    id: 'm-9',
    userId: 'u-9',
    fullName: 'Test Menejer',
    phone: '+998903517021',
    role: 'MANAGER',
    isActive: true,
    lastLoginAt: null,
    venueIds: [],
  },
  temporaryPassword: 'USNViPUQm5',
};

let yuborilgan: unknown[] = [];

function baseHandlers() {
  return [
    ...authedHandlers(DIRECTOR_ME),
    http.get(`${API}/members`, () =>
      HttpResponse.json({ items: [DIREKTOR], total: 1, page: 1, pageSize: 20 }),
    ),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({
        items: [{ id: 'v-1', name: 'Chilonzor maydoni' }],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
    ),
  ];
}

function yaratishHandler() {
  return http.post(`${API}/members`, async ({ request }) => {
    yuborilgan.push(await request.json());
    return HttpResponse.json(YARATILDI, { status: 201 });
  });
}

async function oynaniOch(): Promise<HTMLElement> {
  await screen.findByRole('table');
  await userEvent.click(screen.getByRole('button', { name: /Yangi xodim/ }));
  return await screen.findByRole('dialog');
}

/** antd `Select` — ro'yxat ochiladi, keyin variant bosiladi. */
async function tanla(field: HTMLElement, option: string) {
  await userEvent.click(field);
  await userEvent.click(await screen.findByTitle(option));
}

beforeEach(() => {
  yuborilgan = [];
});

describe('Xodim yaratish', () => {
  it('yaratilgach vaqtinchalik parolni ko`rsatadi', async () => {
    server.use(...baseHandlers(), yaratishHandler());
    renderApp(<AppRouter />, { route: '/members' });

    const oyna = within(await oynaniOch());
    await userEvent.type(
      oyna.getByLabelText('Ism va familiya'),
      'Test Menejer',
    );
    await userEvent.type(oyna.getByLabelText('Telefon'), '+998903517021');
    await tanla(oyna.getByLabelText('Lavozim'), 'Menejer');
    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    expect(await screen.findByText('USNViPUQm5')).toBeInTheDocument();
    expect(yuborilgan).toEqual([
      {
        fullName: 'Test Menejer',
        phone: '+998903517021',
        role: 'MANAGER',
        venueIds: [],
      },
    ]);
  });

  it('administrator uchun stadion tanlanmasa so`rov ketmaydi', async () => {
    server.use(...baseHandlers(), yaratishHandler());
    renderApp(<AppRouter />, { route: '/members' });

    const oyna = within(await oynaniOch());
    await userEvent.type(oyna.getByLabelText('Ism va familiya'), 'Test Admin');
    await userEvent.type(oyna.getByLabelText('Telefon'), '+998903517022');
    await tanla(oyna.getByLabelText('Lavozim'), 'Administrator');

    // Stadion maydoni faqat administrator tanlanganda paydo bo'ladi.
    expect(await oyna.findByLabelText('Stadionlar')).toBeInTheDocument();

    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    expect(
      await oyna.findByText('Kamida bitta stadion tanlang'),
    ).toBeInTheDocument();
    expect(yuborilgan).toEqual([]);
  });

  it('serverning MEMBER_VENUE_REQUIRED xabarini ko`rsatadi', async () => {
    const XABAR =
      'Administrator uchun kamida bitta stadion biriktirilishi kerak.';
    server.use(
      ...baseHandlers(),
      http.post(`${API}/members`, () =>
        HttpResponse.json(
          { code: 'MEMBER_VENUE_REQUIRED', message: XABAR },
          { status: 422 },
        ),
      ),
    );
    renderApp(<AppRouter />, { route: '/members' });

    const oyna = within(await oynaniOch());
    await userEvent.type(oyna.getByLabelText('Ism va familiya'), 'Test Admin');
    await userEvent.type(oyna.getByLabelText('Telefon'), '+998903517022');
    await tanla(oyna.getByLabelText('Lavozim'), 'Administrator');
    // Stadion tanlangan, lekin u shu orada arxivlangan bo'lishi mumkin.
    // Klientdagi qoida serverdagisining o'rnini bosmaydi.
    await tanla(oyna.getByLabelText('Stadionlar'), 'Chilonzor maydoni');
    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    expect(await oyna.findByText(XABAR)).toBeInTheDocument();
  });

  it('band telefon xabarini forma ichida ko`rsatadi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(`${API}/members`, () =>
        HttpResponse.json(
          {
            code: 'PHONE_TAKEN',
            message: 'Bu telefon raqami allaqachon ishlatilgan.',
          },
          { status: 409 },
        ),
      ),
    );
    renderApp(<AppRouter />, { route: '/members' });

    const oyna = within(await oynaniOch());
    await userEvent.type(
      oyna.getByLabelText('Ism va familiya'),
      'Test Menejer',
    );
    await userEvent.type(oyna.getByLabelText('Telefon'), '+998901110001');
    await tanla(oyna.getByLabelText('Lavozim'), 'Menejer');
    await userEvent.click(oyna.getByRole('button', { name: 'Yaratish' }));

    await waitFor(() =>
      expect(
        oyna.getByText('Bu telefon raqami allaqachon ishlatilgan.'),
      ).toBeInTheDocument(),
    );
  });
});
