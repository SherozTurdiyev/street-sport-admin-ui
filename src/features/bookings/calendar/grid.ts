import dayjs from 'dayjs';
import type { Booking, CalendarVenue } from '../api';
import { activeBookings, openRanges } from '../slots';

/**
 * Kalendar panjarasining joylashuvi — SOF funksiyalar.
 *
 * Panjara ikki qatlamdan iborat: fon kataklari (`slots.ts`) va bron
 * bloklari (shu yerda). Ajratish SHART: `buildSlots()` bitta bronni u
 * tegib turgan har bir katakka qo'yadi, kalendarda esa ikki soatlik
 * o'yin ikkita katak emas, bitta uzun blok bo'lib ko'rinishi kerak.
 *
 * O'lchov birligi — kun boshidan hisoblangan DAQIQA. Piksel faqat
 * chizishda paydo bo'ladi, shuning uchun bu yerdagi hisob-kitobni
 * interfeyssiz sinash mumkin.
 */

/** Kun boshidan (server bergan `from`) boshlab daqiqa. */
export function minutesFrom(dayStart: string, iso: string): number {
  return dayjs(iso).diff(dayjs(dayStart), 'minute');
}

/**
 * Barcha ustunlarni qamrovchi vaqt o'qi: eng erta ochilishdan eng kech
 * yopilishgacha. Stadionlarning ish vaqti har xil bo'lsa ham ustunlar
 * bitta o'qda turishi kerak, aks holda yonma-yon turgan ikki bronni
 * solishtirib bo'lmasdi.
 *
 * Hech qaysi stadion shu kuni ochiq bo'lmasa `null` — panjara o'rniga
 * "hamma stadion yopiq" yoziladi.
 */
export function axisRange(
  venues: CalendarVenue[],
  weekday: number,
): { start: number; end: number } | null {
  const ranges = venues.flatMap((v) => openRanges(v.hours, weekday));
  if (ranges.length === 0) return null;

  return {
    start: Math.min(...ranges.map((r) => r.start)),
    end: Math.max(...ranges.map((r) => r.end)),
  };
}

/**
 * Soat yorliqlari. Birinchisi — o'q boshidan keyingi butun soat:
 * 08:15 da ochiladigan stadionda "08:15" emas, "09:00" yoziladi.
 */
export function hourTicks(range: { start: number; end: number }): number[] {
  const ticks: number[] = [];
  for (let m = Math.ceil(range.start / 60) * 60; m <= range.end; m += 60) {
    ticks.push(m);
  }
  return ticks;
}

export type BookingBlock = {
  booking: Booking;
  /** Kun boshidan daqiqa. */
  top: number;
  /** Davomiyligi, daqiqa. */
  height: number;
};

/**
 * Har bir faol bron — bitta blok. Bekor qilingani chiqmaydi: u vaqtni
 * band qilmaydi va o'sha soatga yangi bron ochish mumkin.
 */
export function bookingBlocks(
  venue: CalendarVenue,
  dayStart: string,
): BookingBlock[] {
  return activeBookings(venue.bookings)
    .map((booking) => ({
      booking,
      top: minutesFrom(dayStart, booking.startsAt),
      height: dayjs(booking.endsAt).diff(dayjs(booking.startsAt), 'minute'),
    }))
    .sort((a, b) => a.top - b.top);
}
