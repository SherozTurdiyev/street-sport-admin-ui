import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Backend UTC ISO qaytaradi, ekranda esa har doim Toshkent vaqti
 * ko'rsatiladi. O'girish FAQAT shu yerda: komponentlarda qo'lda hisob
 * yozilsa, ular vaqt o'tishi bilan bir-biridan farq qila boshlaydi.
 *
 * Brauzer soatiga tayanilmaydi — foydalanuvchi boshqa mintaqada bo'lsa
 * ham stadion vaqti ko'rinishi kerak.
 */
export const TASHKENT = 'Asia/Tashkent';

const NONE = '—';

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? dayjs(iso).tz(TASHKENT).format('DD.MM.YYYY HH:mm') : NONE;
}

/** Faqat soat va daqiqa — kalendar va ro'yxatlarda sana takrorlanmaydi. */
export function formatTime(iso: string | null | undefined): string {
  return iso ? dayjs(iso).tz(TASHKENT).format('HH:mm') : NONE;
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? dayjs(iso).tz(TASHKENT).format('DD.MM.YYYY') : NONE;
}

/**
 * Foydalanuvchi tanlagan devor soatini ISO UTC ga o'giradi.
 *
 * `DatePicker` BRAUZER mintaqasida qiymat qaytaradi. Adminka esa har
 * doim Toshkent vaqtida ishlaydi (stadion o'sha yerda). Boshqa
 * mintaqadagi foydalanuvchi 18:00 ni tanlasa, `toISOString()` uni
 * o'zining 18:00 i deb hisoblab, backendga boshqa soatni yuborardi.
 *
 * `wallClock` — `YYYY-MM-DD HH:mm` ko'rinishida.
 */
export function tashkentToIso(wallClock: string): string {
  return dayjs.tz(wallClock, TASHKENT).toISOString();
}

/**
 * Toshkent kunining chegaralari, ISO UTC ko'rinishida.
 *
 * "Bugun" — STADION kuni, brauzer kuni emas: yarim tunda boshqa
 * mintaqadagi foydalanuvchi uchun sana allaqachon almashgan bo'lishi
 * mumkin, stadion uchun esa yo'q (BR-12).
 */
export function tashkentDayRange(now: dayjs.ConfigType = undefined): {
  from: string;
  to: string;
} {
  const start = dayjs(now).tz(TASHKENT).startOf('day');
  return {
    from: start.toISOString(),
    to: start.add(1, 'day').toISOString(),
  };
}

/** Shu paytdan boshlab `days` kunlik oraliq — "yaqin bronlar" uchun. */
export function nextDaysRange(days: number): { from: string; to: string } {
  const now = dayjs();
  return { from: now.toISOString(), to: now.add(days, 'day').toISOString() };
}
