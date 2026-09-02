import dayjs from 'dayjs';
import type { Booking, CalendarVenue } from './api';
import { TASHKENT } from '@/shared/format/time';

/**
 * Kunlik panjara va ko'rsatkichlarni hisoblash — SOF funksiyalar.
 *
 * Ular komponentdan ataylab ajratilgan: yarim tundan o'tuvchi ish
 * vaqti, yopilishlar va bandlik foizi — kalendarning eng nozik joyi va
 * ularni interfeyssiz sinash mumkin bo'lishi kerak.
 */

export type SlotStatus = 'FREE' | 'BOOKED' | 'LIVE' | 'CLOSED' | 'PAST';

export type Slot = {
  /** `HH:mm` — Toshkent mahalliy vaqti. */
  label: string;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
  booking: Booking | null;
};

/** `HH:mm` ni kun boshidan boshlab daqiqaga aylantiradi. `24:00` — 1440. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Kunning ochiq oralig'i, daqiqalarda.
 *
 * Yopilish vaqti ochilishdan kichik bo'lsa (18:00–02:00) oraliq yarim
 * tundan o'tadi va ertangi kunga uzaydi — shuning uchun 24 soat
 * qo'shiladi, aks holda oraliq manfiy chiqib panjara bo'sh qolardi.
 */
export function openRanges(
  hours: CalendarVenue['hours'],
  weekday: number,
): { start: number; end: number }[] {
  return hours
    .filter((h) => h.weekday === weekday)
    .map((h) => {
      const start = toMinutes(h.opensAt);
      const end = toMinutes(h.closesAt);
      return { start, end: end <= start ? end + 24 * 60 : end };
    });
}

export function openMinutes(
  hours: CalendarVenue['hours'],
  weekday: number,
): number {
  return openRanges(hours, weekday).reduce(
    (sum, r) => sum + (r.end - r.start),
    0,
  );
}

/** Bekor qilingan bron vaqtni band qilmaydi — u yangi bron uchun ochiq. */
export function activeBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.status !== 'CANCELLED');
}

export function bookedMinutes(bookings: Booking[]): number {
  return activeBookings(bookings).reduce(
    (sum, b) => sum + dayjs(b.endsAt).diff(dayjs(b.startsAt), 'minute'),
    0,
  );
}

/**
 * Bandlik foizi. Stadion yopiq kunda 0 qaytadi — nolga bo'linish
 * o'rniga, chunki "yopiq kunda bandlik 100%" degani ma'nosiz.
 */
export function occupancy(open: number, booked: number): number {
  if (open <= 0) return 0;
  return Math.min(100, Math.round((booked / open) * 100));
}

/**
 * Kunlik tushum. Pul SATR bo'lib qoladi: `BigInt` bilan qo'shiladi va
 * satr sifatida qaytadi (BR-13). `Number` ga o'girilsa katta
 * summalarda tiyin yo'qolardi.
 */
export function dayRevenue(bookings: Booking[]): string {
  return bookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + BigInt(b.priceTotal) - BigInt(b.discount), 0n)
    .toString();
}

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  // Oraliq YARIM OCHIQ: 19:00–20:00 va 20:00–21:00 to'qnashmaydi.
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Kunning panjarasi: ish vaqti `slotMinutes` qadam bilan bo'linadi va
 * har bir katak holati aniqlanadi.
 *
 * `dayStart` — Toshkent kunining boshlanishi (server bergan `from`).
 * Undan foydalanish MUHIM: brauzer mintaqasidan hisoblansa, boshqa
 * mintaqadagi foydalanuvchi uchun panjara siljib ketardi.
 */
export function buildSlots(
  venue: CalendarVenue,
  dayStart: string,
  weekday: number,
  now: Date = new Date(),
): Slot[] {
  const base = dayjs(dayStart);
  const step = venue.slotMinutes > 0 ? venue.slotMinutes : 60;
  const active = activeBookings(venue.bookings);
  const hozir = now.getTime();

  const slots: Slot[] = [];
  for (const range of openRanges(venue.hours, weekday)) {
    for (let m = range.start; m + step <= range.end; m += step) {
      const start = base.add(m, 'minute');
      const end = start.add(step, 'minute');
      const s = start.valueOf();
      const e = end.valueOf();

      const booking =
        active.find((b) =>
          overlaps(
            s,
            e,
            dayjs(b.startsAt).valueOf(),
            dayjs(b.endsAt).valueOf(),
          ),
        ) ?? null;
      const closed = venue.closures.some((c) =>
        overlaps(s, e, dayjs(c.startsAt).valueOf(), dayjs(c.endsAt).valueOf()),
      );

      slots.push({
        label: start.tz(TASHKENT).format('HH:mm'),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        // Tartib MUHIM: bron yopilishdan ustun turadi, chunki yopilish
        // e'lon qilinganda bronlar bekor qilinishi kerak edi — hali
        // turgan bron ko'rinmay qolmasligi kerak.
        status: booking
          ? s <= hozir && hozir < e
            ? 'LIVE'
            : 'BOOKED'
          : closed
            ? 'CLOSED'
            : e <= hozir
              ? 'PAST'
              : 'FREE',
        booking,
      });
    }
  }
  return slots;
}
