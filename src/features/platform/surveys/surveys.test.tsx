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

const DETAIL = {
  id: 's-1',
  title: 'Mijozlar fikri',
  description: null,
  collectContact: false,
  isActive: true,
  responseCount: 0,
  locked: false,
  questions: [
    {
      id: 'q-1',
      position: 0,
      type: 'SINGLE_CHOICE',
      text: 'Nechta maydon?',
      required: true,
      options: [
        { id: 'o-1', position: 0, text: '1' },
        { id: 'o-2', position: 1, text: '2+' },
      ],
    },
    {
      id: 'q-2',
      position: 1,
      type: 'TEXT',
      text: 'Taklif',
      required: false,
      options: [],
    },
  ],
  createdAt: '2026-09-16T10:00:00.000Z',
  updatedAt: '2026-09-16T10:00:00.000Z',
};

/** Natijalar sahifasi saqlashdan keyin ochiladi — u ham so'rov yuboradi. */
function natijaHandlerlari(detail: object = DETAIL) {
  return [
    http.get(`${ROOT}/s-1`, () => HttpResponse.json(detail)),
    http.get(`${ROOT}/s-1/stats`, () =>
      HttpResponse.json({ responseCount: 0, questions: [] }),
    ),
    http.get(`${ROOT}/s-1/responses`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
    ),
  ];
}

describe('So‘rovnoma formasi', () => {
  beforeEach(() => {
    server.use(
      ...natijaHandlerlari(),
      ...authedHandlers(SUPER_ADMIN_ME),
      ...platformDashboardHandlers(),
    );
  });

  it('yangi so‘rovnoma: savol, variant va tur — yuborilgan tana', async () => {
    let tana: unknown = null;
    server.use(
      http.post(ROOT, async ({ request }) => {
        tana = await request.json();
        return HttpResponse.json(DETAIL, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/new' });

    await user.type(await screen.findByLabelText('Nomi'), 'Mijozlar fikri');
    const [savol1] = screen.getAllByLabelText('Savol matni');
    await user.type(savol1!, 'Nechta maydon?');
    const variantlar = screen.getAllByLabelText(/^Variant \d+$/);
    await user.type(variantlar[0]!, '1');
    await user.type(variantlar[1]!, '2+');

    await user.click(screen.getByRole('button', { name: /Savol qo‘shish/ }));
    const savollar = screen.getAllByLabelText('Savol matni');
    await user.type(savollar[1]!, 'Taklif');
    // Ikkinchi savol turini "Matn javob" ga o'zgartirish.
    await user.click(screen.getAllByLabelText('Savol turi')[1]!);
    await user.click(await screen.findByTitle('Matn javob'));

    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    await expect
      .poll(() => tana)
      .toEqual({
        title: 'Mijozlar fikri',
        description: null,
        collectContact: false,
        questions: [
          {
            type: 'SINGLE_CHOICE',
            text: 'Nechta maydon?',
            required: true,
            options: [{ text: '1' }, { text: '2+' }],
          },
          {
            type: 'TEXT',
            text: 'Taklif',
            required: true,
            options: [],
          },
        ],
      });
  });

  it('tanlov savolida bo‘sh variant bo‘lsa yubormaydi', async () => {
    let yuborildi = false;
    server.use(
      http.post(ROOT, () => {
        yuborildi = true;
        return HttpResponse.json(DETAIL, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/new' });

    await user.type(await screen.findByLabelText('Nomi'), 'Mijozlar fikri');
    await user.type(screen.getByLabelText('Savol matni'), 'Savol');
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(
      (await screen.findAllByText('Variant matnini kiriting')).length,
    ).toBeGreaterThan(0);
    expect(yuborildi).toBe(false);
  });

  it('↑ tugmasi savollar tartibini almashtiradi', async () => {
    let tana: { questions: { text: string }[] } | null = null;
    server.use(
      http.put(`${ROOT}/s-1`, async ({ request }) => {
        tana = (await request.json()) as typeof tana;
        return HttpResponse.json(DETAIL);
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/s-1/edit' });
    await screen.findByDisplayValue('Taklif');

    await user.click(screen.getAllByRole('button', { name: 'Yuqoriga' })[1]!);
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    await expect
      .poll(() => tana?.questions.map((q) => q.text))
      .toEqual(['Taklif', 'Nechta maydon?']);
  });

  it('qulflangan: faqat matn maydonlari ochiq', async () => {
    server.use(
      ...natijaHandlerlari({ ...DETAIL, responseCount: 5, locked: true }),
    );
    renderApp(<AppRouter />, { route: '/platform/surveys/s-1/edit' });

    expect(
      await screen.findByText('5 ta javob bor — faqat matnni tuzatish mumkin'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Savol qo‘shish/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole('switch', { name: 'Ism va telefon so‘ralsin' }),
    ).toBeDisabled();
    for (const b of screen.getAllByRole('button', {
      name: 'Savolni o‘chirish',
    })) {
      expect(b).toBeDisabled();
    }
    expect(screen.getByDisplayValue('Taklif')).toBeEnabled();
  });

  it('409 xabari foydalanuvchiga ko‘rsatiladi', async () => {
    server.use(
      http.put(`${ROOT}/s-1`, () =>
        HttpResponse.json(
          {
            code: 'SURVEY_LOCKED',
            message:
              'So‘rovnomaga javoblar kelgan: faqat matnni tuzatish mumkin.',
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/platform/surveys/s-1/edit' });
    await screen.findByDisplayValue('Taklif');
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(
      await screen.findByText(
        'So‘rovnomaga javoblar kelgan: faqat matnni tuzatish mumkin.',
      ),
    ).toBeInTheDocument();
  });
});
