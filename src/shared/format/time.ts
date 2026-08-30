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

export function formatDate(iso: string | null | undefined): string {
  return iso ? dayjs(iso).tz(TASHKENT).format('DD.MM.YYYY') : NONE;
}
