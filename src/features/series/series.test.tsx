import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, ADMIN_ME, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';
import { SeriesFormModal } from './SeriesFormModal';

const SERIYA = {
  id: 's-1',
  venue: { id: 'v-1', name: 'Chilonzor Arena' },
  customer: {
    id: 'c-1',
    phone: '+998901112233',
    fullName: 'Alisher Rahimov',
  },
  weekdays: [1, 3],
  startTime: '19:00',
  startDate: '2026-09-07',
  endDate: '2026-09-28',
  pricePerHour: '260000',
};

const KARTOCHKA = {
  ...SERIYA,
  durationMinutes: 60,
  stats: {
    totalCount: 7,
    completedCount: 2,
    cancelledCount: 1,
    noShowCount: 0,
    upcomingCount: 4,
    paidCount: 0,
    totalDebt: '0',
    pendingModule: 'M8',
  },
  bookings: [
    {
      id: 'b-1',
      venueId: 'v-1',
      customerId: 'c-1',
      seriesId: 's-1',
      startsAt: '2026-09-07T14:00:00.000Z',
      endsAt: '2026-09-07T15:00:00.000Z',
      priceTotal: '260000',
      discount: '0',
      status: 'CONFIRMED',
      source: 'PANEL',
      cancelReason: null,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ],
};

let soralgan: URL[] = [];
let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers(me: object = DIRECTOR_ME) {
  return [
    ...authedHandlers(me),
    http.get(`${API}/booking-series`, ({ request }) => {
      soralgan.push(new URL(request.url));
      return HttpResponse.json({
        items: [SERIYA],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    }),
    http.get(`${API}/booking-series/s-1`, () => HttpResponse.json(KARTOCHKA)),
    http.post(`${API}/booking-series/s-1/extend`, async ({ request }) => {
      yuborilgan.push({ url: 'extend', body: await request.json() });
      return HttpResponse.json({
        seriesId: 's-1',
        endDate: '2026-10-12',
        pricePerHour: '260000',
        createdCount: 4,
        skipped: [],
        bookings: [],
      });
    }),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({
        items: [{ id: 'v-1', name: 'Chilonzor Arena' }],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
    ),
  ];
}

beforeEach(() => {
  soralgan = [];
  yuborilgan = [];
});

describe('Seriyalar ro`yxati', () => {
  it('bronlar bo`limining uchinchi tabida chiziladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings?tab=series' });

    const jadval = within(await screen.findByRole('table'));
    expect(await jadval.findByText('Alisher Rahimov')).toBeInTheDocument();
    expect(jadval.getByText('Du, Ch')).toBeInTheDocument();
    expect(jadval.getByText("260 000 so'm")).toBeInTheDocument();
  });

  it('«Tugash arafasida» filtri so`rovga tushadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings?tab=series' });
    await screen.findByRole('table');

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Tugash arafasida' }),
    );

    expect(soralgan.at(-1)?.searchParams.get('expiringWithinDays')).toBe('7');
  });
});

describe('Seriya yaratish', () => {
  function yaratishHandlers() {
    return [
      http.post(`${API}/booking-series/preview`, async ({ request }) => {
        yuborilgan.push({ url: 'preview', body: await request.json() });
        return HttpResponse.json({
          total: 2,
          free: 1,
          pricePerHour: '260000',
          pricePerOccurrence: '260000',
          occurrences: [
            {
              startsAt: '2026-09-07T14:00:00.000Z',
              endsAt: '2026-09-07T15:00:00.000Z',
              status: 'FREE',
            },
            {
              startsAt: '2026-09-09T14:00:00.000Z',
              endsAt: '2026-09-09T15:00:00.000Z',
              status: 'BUSY',
            },
          ],
        });
      }),
      http.post(`${API}/customers/lookup`, () =>
        HttpResponse.json({
          created: false,
          customer: {
            id: 'c-1',
            phone: '+998901112233',
            fullName: 'Alisher Rahimov',
            note: null,
            tags: [],
            isBlacklisted: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
      http.post(`${API}/booking-series`, async ({ request }) => {
        yuborilgan.push({ url: 'create', body: await request.json() });
        return HttpResponse.json(
          {
            seriesId: 's-2',
            pricePerHour: '260000',
            createdCount: 1,
            skipped: [
              {
                startsAt: '2026-09-09T14:00:00.000Z',
                endsAt: '2026-09-09T15:00:00.000Z',
              },
            ],
            bookings: [],
          },
          { status: 201 },
        );
      }),
      ...baseHandlers(),
    ];
  }

  /*
   * Forma ATAYLAB o'zi chiziladi, butun ilova emas.
   *
   * `AppRouter` orqali bu ikki test ~10 s ketardi (bronlar sahifasi,
   * kalendar va layout har bir bosishda qayta chizilardi) va 15
   * soniyalik chegaraga yaqin turib, to'liq yugurishda yiqilardi.
   * Forma o'zi bilan o'sha qadamlar bir necha barobar tez. Oynaning
   * bo'limga ULANGANI yuqoridagi ro'yxat testida tekshiriladi.
   */
  async function korish(): Promise<HTMLElement> {
    renderApp(<SeriesFormModal open onClose={() => {}} />);

    const oynaEl = await screen.findByRole('dialog');
    const oyna = within(oynaEl);

    await userEvent.click(oyna.getByLabelText('Stadion'));
    await userEvent.click(await screen.findByTitle('Chilonzor Arena'));

    await userEvent.click(oyna.getByLabelText('Hafta kunlari'));
    await userEvent.click(await screen.findByTitle('Dushanba'));

    await userEvent.type(oyna.getByLabelText('Boshlanish vaqti'), '19:00');
    await userEvent.keyboard('{Enter}');

    // ATAYLAB `.ant-picker-range` ichidan: vaqt tanlagichi ham
    // `.ant-picker-input` sinfini ishlatadi va oddiy tanlov uni ilib
    // ketardi.
    const [from, to] = oynaEl.querySelectorAll(
      '.ant-picker-range .ant-picker-input input',
    );
    await userEvent.type(from as HTMLElement, '2026-09-07');
    await userEvent.keyboard('{Enter}');
    await userEvent.type(to as HTMLElement, '2026-09-28');
    await userEvent.keyboard('{Enter}');

    await userEvent.type(oyna.getByLabelText('Mijoz telefoni'), '901112233');
    await userEvent.tab();

    await userEvent.click(
      oyna.getByRole('button', { name: 'Oldindan ko‘rish' }),
    );
    return oynaEl;
  }

  /*
   * Bu ikki testga ATAYLAB uzunroq muddat berilgan.
   *
   * O'lchandi: formani to'ldirish (stadion, hafta kunlari, vaqt, sana
   * oralig'i, mijoz) qadamlarining har biri jsdom da 0.4–1.1 s oladi,
   * ustiga ikkita server so'rovi (oldindan ko'rish va yaratish)
   * qo'shiladi — jami ~8 s. Bu narx SSENARIYNING O'ZIDA, atrofdagi
   * sahifada emas: sahifa allaqachon olib tashlangan (`korish` faqat
   * oynani chizadi).
   *
   * Ya'ni muddatni uzaytirish sekinlikni yashirmaydi — u shu
   * ssenariyning haqiqiy narxi.
   */
  it('sanalar holati bilan ko`rsatiladi va band sana o`tkazib yuboriladi', async () => {
    server.use(...yaratishHandlers());
    const oynaEl = await korish();
    const oyna = within(oynaEl);

    expect(await oyna.findByText('Band')).toBeInTheDocument();
    expect(oyna.getByText('Bo‘sh')).toBeInTheDocument();

    await userEvent.click(
      oyna.getByRole('button', { name: 'Bo‘sh sanalarga yaratish' }),
    );

    await screen.findByText('1 ta bron yaratildi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'create',
      body: { onConflict: 'SKIP', customerId: 'c-1', weekdays: [1] },
    });
    expect(
      await screen.findByText(
        '1 ta sana band bo‘lgani uchun o‘tkazib yuborildi',
      ),
    ).toBeInTheDocument();
  }, 30_000);

  it('«band bo`lsa yaratma» tanlanganda server xatosi ko`rinadi', async () => {
    server.use(
      http.post(`${API}/booking-series`, () =>
        HttpResponse.json(
          {
            code: 'SERIES_HAS_CONFLICTS',
            message: 'Band sanalar bor.',
            details: { conflicts: [{ startsAt: '2026-09-09T14:00:00.000Z' }] },
          },
          { status: 409 },
        ),
      ),
      ...yaratishHandlers(),
    );
    const oyna = within(await korish());

    await userEvent.click(
      await oyna.findByRole('button', { name: 'Band sana bo‘lsa — yaratma' }),
    );

    expect(
      await oyna.findByText(/Band sanalar bor\. Band sanalar: 1 ta\./),
    ).toBeInTheDocument();
  }, 30_000);
});

describe('Seriya sahifasi', () => {
  it('statistika va uchrashuvlar ko`rinadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings/series/s-1' });

    expect(
      await screen.findByRole('heading', { name: 'Alisher Rahimov' }),
    ).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    const jadval = within(screen.getByRole('table'));
    expect(jadval.getByText("260 000 so'm")).toBeInTheDocument();
  });

  it('uzaytirish `weeks` yuboradi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings/series/s-1' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Uzaytirish' }),
    );
    const oyna = within(await screen.findByRole('dialog'));
    await userEvent.click(oyna.getByRole('button', { name: 'Uzaytirish' }));

    await screen.findByText('4 ta bron qo‘shildi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'extend',
      body: { weeks: 2, onConflict: 'SKIP' },
    });
  });

  it('administratorda butun seriyani bekor qilish yo`q', async () => {
    server.use(...baseHandlers(ADMIN_ME));
    renderApp(<AppRouter />, { route: '/bookings/series/s-1' });

    await screen.findByRole('heading', { name: 'Alisher Rahimov' });
    expect(
      screen.queryByRole('button', { name: 'Butun seriyani bekor qilish' }),
    ).not.toBeInTheDocument();
  });
});
