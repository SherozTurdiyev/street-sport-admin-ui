import { describe, expect, it } from 'vitest';
import type { Booking, CalendarVenue } from '@/features/bookings/api';
import {
  bookedMinutes,
  buildSlots,
  dayRevenue,
  occupancy,
  openMinutes,
} from './slots';

/** 2026-09-02 — chorshanba. Toshkent kuni UTC da 19:00 da boshlanadi. */
const DAY_START = '2026-09-01T19:00:00.000Z';
const WEEKDAY = 3;

function bron(over: Partial<Booking> = {}): Booking {
  return {
    id: 'b-1',
    venueId: 'v-1',
    customerId: 'c-1',
    seriesId: null,
    startsAt: '2026-09-02T05:00:00.000Z',
    endsAt: '2026-09-02T06:00:00.000Z',
    priceTotal: '150000',
    discount: '0',
    status: 'CONFIRMED',
    source: 'PANEL',
    cancelReason: null,
    paidAmount: '0',
    debt: '150000',
    createdAt: '2026-09-01T00:00:00.000Z',
    ...over,
  };
}

function stadion(over: Partial<CalendarVenue> = {}): CalendarVenue {
  return {
    venueId: 'v-1',
    name: 'Chilonzor Arena',
    slotMinutes: 60,
    status: 'ACTIVE',
    hours: [{ weekday: WEEKDAY, opensAt: '08:00', closesAt: '12:00' }],
    closures: [],
    bookings: [],
    ...over,
  };
}

describe('Kunlik panjara', () => {
  it('ish vaqtini qadam bo`yicha bo`ladi', () => {
    const slots = buildSlots(
      stadion(),
      DAY_START,
      WEEKDAY,
      new Date('2026-09-02T00:00:00.000Z'),
    );
    expect(slots.map((s) => s.label)).toEqual([
      '08:00',
      '09:00',
      '10:00',
      '11:00',
    ]);
  });

  it('yarim tundan o`tuvchi ish vaqtini yo`qotmaydi', () => {
    // 18:00–02:00 — yopilish ochilishdan kichik. Ayirma manfiy
    // chiqsa panjara bo'sh qolardi.
    const kech = stadion({
      hours: [{ weekday: WEEKDAY, opensAt: '18:00', closesAt: '02:00' }],
    });
    expect(openMinutes(kech.hours, WEEKDAY)).toBe(8 * 60);
    expect(
      buildSlots(
        kech,
        DAY_START,
        WEEKDAY,
        new Date('2026-09-02T00:00:00.000Z'),
      ),
    ).toHaveLength(8);
  });

  it('boshqa kunning ish vaqti panjaraga tushmaydi', () => {
    const slots = buildSlots(
      stadion({ hours: [{ weekday: 1, opensAt: '08:00', closesAt: '23:00' }] }),
      DAY_START,
      WEEKDAY,
    );
    expect(slots).toEqual([]);
  });

  it('band, hozirgi va o`tgan kataklarni ajratadi', () => {
    const slots = buildSlots(
      stadion({ bookings: [bron()] }),
      DAY_START,
      WEEKDAY,
      // 10:30 Toshkent = 05:30 UTC — 10:00–11:00 katagi ichida.
      new Date('2026-09-02T05:30:00.000Z'),
    );
    const holat = Object.fromEntries(slots.map((s) => [s.label, s.status]));
    // Bron 05:00–06:00 UTC = 10:00–11:00 Toshkent.
    expect(holat['10:00']).toBe('LIVE');
    expect(holat['08:00']).toBe('PAST');
    expect(holat['11:00']).toBe('FREE');
  });

  it('bekor qilingan bron vaqtni band qilmaydi', () => {
    const slots = buildSlots(
      stadion({ bookings: [bron({ status: 'CANCELLED' })] }),
      DAY_START,
      WEEKDAY,
      new Date('2026-09-02T00:00:00.000Z'),
    );
    expect(slots.every((s) => s.status !== 'BOOKED')).toBe(true);
  });

  it('yopilish katagini yopiq deb belgilaydi', () => {
    const slots = buildSlots(
      stadion({
        closures: [
          {
            startsAt: '2026-09-02T05:00:00.000Z',
            endsAt: '2026-09-02T06:00:00.000Z',
            reason: 'Ta’mir',
          },
        ],
      }),
      DAY_START,
      WEEKDAY,
      new Date('2026-09-02T00:00:00.000Z'),
    );
    expect(slots.find((s) => s.label === '10:00')?.status).toBe('CLOSED');
  });

  it('qadam ish vaqtiga to`liq sig`masa oxirgi yarim katak chizilmaydi', () => {
    // 08:00–09:30, qadam 60 daqiqa: 09:00–10:00 ish vaqtidan chiqadi.
    const slots = buildSlots(
      stadion({
        hours: [{ weekday: WEEKDAY, opensAt: '08:00', closesAt: '09:30' }],
      }),
      DAY_START,
      WEEKDAY,
    );
    expect(slots).toHaveLength(1);
  });
});

describe('Kunlik ko`rsatkichlar', () => {
  it('bandlikni foizda beradi', () => {
    expect(occupancy(480, 120)).toBe(25);
  });

  it('yopiq kunda nolga bo`lmaydi', () => {
    expect(occupancy(0, 0)).toBe(0);
  });

  it('bekor qilingan bron band daqiqaga qo`shilmaydi', () => {
    expect(bookedMinutes([bron(), bron({ status: 'CANCELLED' })])).toBe(60);
  });

  it('tushumni SATR sifatida qo`shadi (BR-13)', () => {
    const summa = dayRevenue([
      bron({ status: 'COMPLETED', priceTotal: '9007199254740993' }),
      bron({ status: 'COMPLETED', priceTotal: '2', discount: '1' }),
      // Yakunlanmagan bron tushumga kirmaydi.
      bron({ status: 'CONFIRMED', priceTotal: '999' }),
    ]);
    // `Number` bilan hisoblanganda bu qiymat aniqligini yo'qotardi.
    expect(summa).toBe('9007199254740994');
  });
});
