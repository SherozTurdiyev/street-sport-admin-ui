import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, ADMIN_ME, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const BRON = {
  id: 'b-1',
  venueId: 'v-1',
  customerId: 'c-1',
  seriesId: null,
  startsAt: '2026-09-07T14:00:00.000Z',
  endsAt: '2026-09-07T15:00:00.000Z',
  priceTotal: '200000',
  discount: '0',
  status: 'CONFIRMED',
  source: 'PANEL',
  cancelReason: null,
  paidAmount: '80000',
  debt: '120000',
  createdAt: '2026-09-01T00:00:00.000Z',
};

const TOLOV = {
  id: 'p-1',
  bookingId: 'b-1',
  amount: '80000',
  method: 'CARD',
  type: 'PAYMENT',
  shiftId: null,
  receivedBy: 'u-1',
  receiverName: 'Anvar Direktorov',
  reason: null,
  reversesPaymentId: null,
  paidAt: '2026-09-02T09:00:00.000Z',
};

let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers(me: object = DIRECTOR_ME, status = 'CONFIRMED') {
  return [
    ...authedHandlers(me),
    http.get(`${API}/bookings/b-1`, () =>
      HttpResponse.json({
        ...BRON,
        status,
        venue: {
          id: 'v-1',
          name: 'Chilonzor Arena',
          sportType: 'FOOTBALL_5X5',
          slotMinutes: 60,
        },
        customer: {
          id: 'c-1',
          phone: '+998901112233',
          fullName: 'Alisher Rahimov',
          isBlacklisted: false,
        },
      }),
    ),
    http.get(`${API}/bookings/b-1/payments`, () =>
      HttpResponse.json({
        items: [TOLOV],
        balance: {
          priceTotal: '200000',
          discount: '0',
          paid: '80000',
          refunded: '0',
          debt: '120000',
        },
      }),
    ),
    http.post(`${API}/bookings/b-1/payments`, async ({ request }) => {
      yuborilgan.push({ url: 'payment', body: await request.json() });
      return HttpResponse.json(TOLOV, { status: 201 });
    }),
    http.post(`${API}/bookings/b-1/refunds`, async ({ request }) => {
      yuborilgan.push({ url: 'refund', body: await request.json() });
      return HttpResponse.json(
        { ...TOLOV, id: 'p-2', type: 'REFUND' },
        { status: 201 },
      );
    }),
    http.get(`${API}/bookings`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
    ),
    http.get(`${API}/bookings/calendar/day`, () =>
      HttpResponse.json({
        date: '2026-09-02',
        from: '2026-09-01T19:00:00.000Z',
        to: '2026-09-02T19:00:00.000Z',
        venues: [],
      }),
    ),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
    ),
  ];
}

beforeEach(() => {
  yuborilgan = [];
});

/**
 * Yon panelning o'zi ham `role="dialog"`, antd `Modal` esa nom
 * e'lon qilmaydi. Ustida ochilgani — oxirgisi.
 */
async function oxirgiOyna(): Promise<HTMLElement> {
  const oynalar = await screen.findAllByRole('dialog');
  return oynalar[oynalar.length - 1] as HTMLElement;
}

describe('Bron kartochkasidagi to`lovlar', () => {
  it('balans va to`lov tarixi ko`rinadi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    expect(await screen.findByText("80 000 so'm")).toBeInTheDocument();
    // Qarz alohida ko'rsatiladi: "qancha qoldi" eng ko'p so'raladigan savol.
    expect(screen.getByText("120 000 so'm")).toBeInTheDocument();
    // To'lov usuli qatorda ko'rinadi.
    expect(screen.getByText('Karta')).toBeInTheDocument();
  });

  it('to`lov qabul qilinganda summa oldindan qarz bilan to`ladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'To‘lov qabul qilish' }),
    );

    const oyna = within(await oxirgiOyna());
    // Kassada eng ko'p uchraydigan holat — "hammasini to'ladi".
    expect(oyna.getByLabelText('Summa')).toHaveValue('120 000');

    await userEvent.click(oyna.getByRole('button', { name: 'Qabul qilish' }));

    await screen.findByText('To‘lov qabul qilindi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'payment',
      body: { amount: '120000', method: 'CASH' },
    });
  });

  it('qaytarishda sabab majburiy', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Qaytarish' }),
    );
    const oyna = within(await oxirgiOyna());
    await userEvent.click(oyna.getByRole('button', { name: 'Qaytarish' }));

    expect(await oyna.findByText('Sababni yozing')).toBeInTheDocument();
    expect(yuborilgan).toHaveLength(0);
  });

  it('sabab bilan qaytarish yuboriladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Qaytarish' }),
    );
    const oyna = within(await oxirgiOyna());
    await userEvent.type(oyna.getByLabelText('Sabab'), 'Kech boshlandi');
    await userEvent.click(oyna.getByRole('button', { name: 'Qaytarish' }));

    await screen.findByText('Qaytarildi');
    expect(yuborilgan.at(-1)).toMatchObject({
      url: 'refund',
      body: { amount: '80000', reason: 'Kech boshlandi' },
    });
  });

  it('administratorda qaytarish tugmasi YO`Q', async () => {
    // `payment.refund` administratorga berilmagan — qaytarish
    // suiiste'molning eng oson yo'li.
    server.use(
      ...baseHandlers({ ...ADMIN_ME, permissions: ['payment.accept'] }),
    );
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    await screen.findByRole('button', { name: 'To‘lov qabul qilish' });
    expect(
      screen.queryByRole('button', { name: 'Qaytarish' }),
    ).not.toBeInTheDocument();
  });

  it('bekor qilingan bronga to`lov tugmasi chizilmaydi', async () => {
    server.use(...baseHandlers(DIRECTOR_ME, 'CANCELLED'));
    renderApp(<AppRouter />, { route: '/bookings?booking=b-1' });

    // Qaytarish qoladi: aynan bekor qilinganda u eng kerak bo'ladi.
    expect(
      await screen.findByRole('button', { name: 'Qaytarish' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'To‘lov qabul qilish' }),
    ).not.toBeInTheDocument();
  });
});
