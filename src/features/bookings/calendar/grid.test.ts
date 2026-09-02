import { describe, expect, it } from 'vitest';
import type { Booking, CalendarVenue } from '../api';
import { axisRange, bookingBlocks, hourTicks, minutesFrom } from './grid';

/** Toshkent kunining boshlanishi — server aynan shuni beradi. */
const KUN = '2026-08-31T19:00:00.000Z';

function bron(over: Partial<Booking> = {}): Booking {
  return {
    id: 'b-1',
    venueId: 'v-1',
    customerId: 'c-1',
    seriesId: null,
    startsAt: '2026-09-01T14:00:00.000Z',
    endsAt: '2026-09-01T16:00:00.000Z',
    priceTotal: '300000',
    discount: '0',
    status: 'CONFIRMED',
    source: 'PANEL',
    cancelReason: null,
    createdAt: KUN,
    ...over,
  };
}

function stadion(over: Partial<CalendarVenue> = {}): CalendarVenue {
  return {
    venueId: 'v-1',
    name: 'Chilonzor Arena',
    slotMinutes: 60,
    status: 'ACTIVE',
    hours: [{ weekday: 1, opensAt: '08:00', closesAt: '23:00' }],
    closures: [],
    bookings: [],
    ...over,
  };
}

describe('Kalendar o`qi', () => {
  it('barcha ustunlarni qamraydi', () => {
    const kechgacha = stadion({
      venueId: 'v-2',
      hours: [{ weekday: 1, opensAt: '10:00', closesAt: '02:00' }],
    });

    // Yarim tundan o'tgan yopilish ertangi kunga uzayadi: 02:00 -> 26:00.
    expect(axisRange([stadion(), kechgacha], 1)).toEqual({
      start: 480,
      end: 1560,
    });
  });

  it('hech qaysi stadion ochiq bo`lmasa `null`', () => {
    // Yakshanba (7) uchun ish vaqti yozilmagan.
    expect(axisRange([stadion()], 7)).toBeNull();
  });

  it('soat yorliqlari butun soatlarda', () => {
    expect(hourTicks({ start: 480, end: 600 })).toEqual([480, 540, 600]);
    // Boshlanish soat ustida emas: birinchi yorliq keyingi butun soatda.
    expect(hourTicks({ start: 495, end: 600 })).toEqual([540, 600]);
  });
});

describe('Bron bloklari', () => {
  it('ikki soatlik bron BITTA blok bo`ladi', () => {
    const bloklar = bookingBlocks(stadion({ bookings: [bron()] }), KUN);

    expect(bloklar).toHaveLength(1);
    // 14:00Z = Toshkentda 19:00, kun boshidan 19 soat.
    expect(bloklar[0]?.top).toBe(19 * 60);
    expect(bloklar[0]?.height).toBe(120);
  });

  it('bekor qilingan bron blok bermaydi', () => {
    const venue = stadion({
      bookings: [bron({ status: 'CANCELLED' }), bron({ id: 'b-2' })],
    });

    expect(bookingBlocks(venue, KUN).map((b) => b.booking.id)).toEqual(['b-2']);
  });

  it('bloklar vaqt bo`yicha tartiblanadi', () => {
    const venue = stadion({
      bookings: [
        bron({
          id: 'kech',
          startsAt: '2026-09-01T16:00:00.000Z',
          endsAt: '2026-09-01T17:00:00.000Z',
        }),
        bron({
          id: 'erta',
          startsAt: '2026-09-01T05:00:00.000Z',
          endsAt: '2026-09-01T06:00:00.000Z',
        }),
      ],
    });

    expect(bookingBlocks(venue, KUN).map((b) => b.booking.id)).toEqual([
      'erta',
      'kech',
    ]);
  });
});

describe('Kun boshidan daqiqa', () => {
  it('server bergan `from` dan sanaydi', () => {
    expect(minutesFrom(KUN, '2026-09-01T14:00:00.000Z')).toBe(19 * 60);
    expect(minutesFrom(KUN, KUN)).toBe(0);
  });
});
