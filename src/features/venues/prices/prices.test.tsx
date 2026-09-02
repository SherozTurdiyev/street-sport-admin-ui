import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  DIRECTOR_ME,
  authedHandlers,
  venueDayHandlers,
} from '@/test/handlers';
import { AppRouter } from '@/app/router';

const STADION = {
  id: 'v-1',
  orgId: 'o-1',
  name: 'Chilonzor Arena',
  sportType: 'FOOTBALL_5X5',
  surface: null,
  sizeLabel: null,
  isIndoor: false,
  city: 'Toshkent',
  address: null,
  latitude: null,
  longitude: null,
  contactPhone: null,
  slotMinutes: 60,
  amenities: [],
  photos: [],
  description: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const BAZAVIY = {
  id: 'r-1',
  venueId: 'v-1',
  name: 'Bazaviy',
  isBase: true,
  weekdays: [],
  startsTime: null,
  endsTime: null,
  pricePerHour: '150000',
  validFrom: null,
  validTo: null,
  priority: 0,
};

const KECHKI = {
  ...BAZAVIY,
  id: 'r-2',
  name: 'Kechki',
  isBase: false,
  weekdays: [1, 2, 3, 4, 5],
  startsTime: '18:00',
  endsTime: '23:00',
  pricePerHour: '260000',
  priority: 10,
};

/** Har kunda 24 soat: 18:00 dan boshlab kechki tarif. */
function kunlar() {
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    hours: Array.from({ length: 24 }, (_, hour) => {
      const kechki = weekday <= 5 && hour >= 18 && hour < 23;
      return {
        hour,
        pricePerHour: kechki ? '260000' : '150000',
        ruleId: kechki ? 'r-2' : 'r-1',
        ruleName: kechki ? 'Kechki' : 'Bazaviy',
      };
    }),
  }));
}

let yuborilgan: { url: string; body: unknown }[] = [];

function baseHandlers(rules: object[] = [BAZAVIY, KECHKI]) {
  return [
    ...authedHandlers(DIRECTOR_ME),
    http.get(`${API}/venues`, () =>
      HttpResponse.json({ items: [STADION], total: 1, page: 1, pageSize: 20 }),
    ),
    http.get(`${API}/venues/v-1`, () =>
      HttpResponse.json({ ...STADION, hours: [], closures: [] }),
    ),
    http.get(`${API}/venues/v-1/hours`, () =>
      HttpResponse.json({ venueId: 'v-1', hours: [] }),
    ),
    http.get(`${API}/venues/v-1/price-rules`, () => HttpResponse.json(rules)),
    http.get(`${API}/venues/v-1/price-rules/table`, () =>
      HttpResponse.json({ venueId: 'v-1', days: kunlar() }),
    ),
    ...venueDayHandlers('v-1'),
  ];
}

/** antd oynasining ochiq nomi yo'q — ro'yxatdagi oxirgisi olinadi. */
async function oxirgiOyna(): Promise<HTMLElement> {
  const oynalar = await screen.findAllByRole('dialog');
  return oynalar[oynalar.length - 1] as HTMLElement;
}

/**
 * Manzildagi `?tab=prices` to'g'ridan-to'g'ri narxlar bo'limini ochadi
 * — kartochkadagi tishli g'ildirak ham shu havolaga olib boradi.
 */
async function narxBolimi(): Promise<HTMLElement> {
  await screen.findByRole('button', { name: 'Yangi qoida' });
  return document.body;
}

beforeEach(() => {
  yuborilgan = [];
});

describe('Narx qoidalari', () => {
  it('bazaviy qoida yo`q stadionda ogohlantiradi', async () => {
    server.use(...baseHandlers([]));
    renderApp(<AppRouter />, { route: '/venues/v-1?tab=prices' });

    const narx = within(await narxBolimi());
    // Bazaviy qoidasiz bron UMUMAN yaratilmaydi — buni foydalanuvchi
    // bron yaratmoqchi bo'lganda emas, hozir bilishi kerak.
    expect(await narx.findByText(/bazaviy qoida yo.?q/i)).toBeInTheDocument();
  });

  it('narxni SATR ko`rinishida yuboradi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(`${API}/venues/v-1/price-rules`, async ({ request }) => {
        yuborilgan.push({ url: request.url, body: await request.json() });
        return HttpResponse.json(KECHKI, { status: 201 });
      }),
    );
    renderApp(<AppRouter />, { route: '/venues/v-1?tab=prices' });

    const narx = within(await narxBolimi());
    await userEvent.click(narx.getByRole('button', { name: 'Yangi qoida' }));

    await screen.findByLabelText('Soatiga narx');
    const oyna = within(await oxirgiOyna());
    await userEvent.type(oyna.getByLabelText('Nomi'), 'Kechki');
    await userEvent.type(oyna.getByLabelText('Soatiga narx'), '260000');
    await userEvent.click(oyna.getByRole('button', { name: 'Saqlash' }));

    await screen.findByText(/qoida qo.?shildi/i);
    expect(yuborilgan[0]?.body).toMatchObject({
      name: 'Kechki',
      // Satr, son EMAS: 260000 emas, '260000'.
      pricePerHour: '260000',
    });
  });

  it('qoidani tahrirlaydi va vaqt oralig`ini tozalay oladi', async () => {
    server.use(
      ...baseHandlers(),
      http.patch(`${API}/venues/v-1/price-rules/r-2`, async ({ request }) => {
        yuborilgan.push({ url: request.url, body: await request.json() });
        return HttpResponse.json({ ...KECHKI, pricePerHour: '300000' });
      }),
    );
    renderApp(<AppRouter />, { route: '/venues/v-1?tab=prices' });

    const narx = within(await narxBolimi());
    // Tahrirlash amallar ustunida — nomni bosishni topish shart emas.
    const qator = narx.getByRole('row', { name: /Kechki/ });
    await userEvent.click(
      within(qator).getByRole('button', { name: 'Tahrirlash' }),
    );

    const oynaEl = await oxirgiOyna();
    const oyna = within(oynaEl);
    const maydon = oyna.getByLabelText('Soatiga narx');
    // Serverdagi qiymat formaga tushgan bo'lishi kerak.
    expect(maydon).toHaveValue('260000');
    await userEvent.clear(maydon);
    await userEvent.type(maydon, '300000');

    // Vaqt oralig'ini tozalaymiz: server uni `null` sifatida ko'rishi
    // kerak, aks holda eski oraliq joyida qolardi. antd tozalash
    // belgisining ochiq nomi yo'q, shuning uchun sinf bo'yicha.
    const tozalash = oynaEl.querySelector('.ant-picker-clear');
    if (!tozalash) throw new Error('Tozalash belgisi topilmadi');
    // `userEvent` bu yerda ishlamaydi: belgi sichqoncha ustiga
    // kelmaguncha `pointer-events: none` bo'lib turadi, jsdom esa
    // hoverni chizmaydi. Hodisa to'g'ridan-to'g'ri yuboriladi.
    fireEvent.mouseDown(tozalash);
    fireEvent.click(tozalash);

    await userEvent.click(oyna.getByRole('button', { name: 'Saqlash' }));

    await screen.findByText(/qoida yangilandi/i);
    expect(yuborilgan).toHaveLength(1);
    expect(yuborilgan[0]?.url).toBe(`${API}/venues/v-1/price-rules/r-2`);
    expect(yuborilgan[0]?.body).toMatchObject({
      pricePerHour: '300000',
      startsTime: null,
      endsTime: null,
      weekdays: [1, 2, 3, 4, 5],
    });
    // Bu testda eng ko'p qadam bor: sahifa, oyna, uch maydon va
    // tozalash. To'liq yuklamada umumiy chegaraga tegib ketardi.
  }, 30_000);

  it('prioritet to`qnashuvi xabarini forma ichida ko`rsatadi', async () => {
    const XABAR =
      'Bir xil prioritetli qoidalar ustma-ust tushdi. Prioritetni aniqlashtiring.';
    server.use(
      ...baseHandlers(),
      http.post(`${API}/venues/v-1/price-rules`, () =>
        HttpResponse.json(
          { code: 'PRICE_RULE_CONFLICT', message: XABAR },
          { status: 409 },
        ),
      ),
    );
    renderApp(<AppRouter />, { route: '/venues/v-1?tab=prices' });

    const narx = within(await narxBolimi());
    await userEvent.click(narx.getByRole('button', { name: 'Yangi qoida' }));

    await screen.findByLabelText('Soatiga narx');
    const oyna = await oxirgiOyna();
    await userEvent.type(within(oyna).getByLabelText('Soatiga narx'), '260000');
    await userEvent.click(
      within(oyna).getByRole('button', { name: 'Saqlash' }),
    );

    expect(await within(oyna).findByText(XABAR)).toBeInTheDocument();
  });

  it('haftalik panjarada 168 katak va tarif nomi bo`ladi', async () => {
    server.use(...baseHandlers());
    renderApp(<AppRouter />, { route: '/venues/v-1?tab=prices' });

    const narx = within(await narxBolimi());
    const panjara = await narx.findByRole('table', {
      name: 'Haftalik narx jadvali',
    });

    // 7 kun × 24 soat. Sarlavhalar `columnheader`/`rowheader`, shuning
    // uchun `cell` lar aynan kataklar.
    expect(within(panjara).getAllByRole('cell')).toHaveLength(168);
    expect(
      within(panjara).getAllByTitle(/Kechki · 260 000 so.?m/),
    ).not.toHaveLength(0);
  });

  it('kalkulyator segmentlarni va jamini ko`rsatadi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(
        `${API}/venues/v-1/price-rules/calculate`,
        async ({ request }) => {
          yuborilgan.push({ url: request.url, body: await request.json() });
          return HttpResponse.json({
            totalPrice: '410000',
            segments: [
              {
                from: '2026-09-01T12:00:00.000Z',
                to: '2026-09-01T13:00:00.000Z',
                minutes: 60,
                pricePerHour: '150000',
                price: '150000',
                ruleId: 'r-1',
                ruleName: 'Bazaviy',
              },
              {
                from: '2026-09-01T13:00:00.000Z',
                to: '2026-09-01T14:00:00.000Z',
                minutes: 60,
                pricePerHour: '260000',
                price: '260000',
                ruleId: 'r-2',
                ruleName: 'Kechki',
              },
            ],
          });
        },
      ),
    );
    renderApp(<AppRouter />, { route: '/venues/v-1?tab=prices' });

    const narx = within(await narxBolimi());
    await userEvent.type(
      narx.getByLabelText('Boshlanishi'),
      '2026-09-01 17:00{enter}',
    );
    await userEvent.type(
      narx.getByLabelText('Tugashi'),
      '2026-09-01 19:00{enter}',
    );
    await userEvent.click(narx.getByRole('button', { name: 'Hisoblash' }));

    // Segmentlar ko'rinadi — "nega 410 000?" degan savol javob topadi.
    expect(await narx.findByText("410 000 so'm")).toBeInTheDocument();

    // Bo'limda uchta jadval bor ("Bazaviy" ro'yxatda ham, panjara
    // izohida ham uchraydi), shuning uchun aynan segmentlar tekshiriladi.
    const segmentlar = within(
      await narx.findByRole('region', { name: 'Narx segmentlari' }),
    );
    expect(segmentlar.getByText('Bazaviy')).toBeInTheDocument();
    expect(segmentlar.getByText('Kechki')).toBeInTheDocument();

    // Devor soati Toshkent mintaqasida yuborilishi kerak: 17:00 → 12:00 UTC.
    expect(yuborilgan[0]?.body).toEqual({
      startsAt: '2026-09-01T12:00:00.000Z',
      endsAt: '2026-09-01T14:00:00.000Z',
    });
  });
});
