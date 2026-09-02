/**
 * Pul backenddan SATR sifatida keladi va shunday qoladi (BR-13).
 * `Number` ga o'girish mumkin emas: JavaScript butun sonlarni faqat
 * 2^53 gacha aniq saqlaydi va katta summalarda tiyin yo'qoladi.
 *
 * Shuning uchun ajratish ham satr ustida bajariladi.
 */
const GROUP = /\B(?=(\d{3})+(?!\d))/g;

/** Uchtalab ajratadi: `200000` -> `200 000`. */
export function groupDigits(digits: string): string {
  return digits.replace(GROUP, ' ');
}

/**
 * Kiritilgan matndan summa qiymati. Faqat raqamlar qoladi; boshidagi
 * ortiqcha nol olib tashlanadi (`0200` -> `200`), lekin yakka `0`
 * saqlanadi — bepul soat ham qiymat.
 */
export function moneyDigits(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

export function formatMoney(amount: string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const negative = amount.startsWith('-');
  const digits = negative ? amount.slice(1) : amount;
  if (!/^\d+$/.test(digits)) return amount;
  return `${negative ? '-' : ''}${groupDigits(digits)} so'm`;
}
