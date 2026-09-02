/**
 * Pul backenddan SATR sifatida keladi va shunday qoladi (BR-13).
 * `Number` ga o'girish mumkin emas: JavaScript butun sonlarni faqat
 * 2^53 gacha aniq saqlaydi va katta summalarda tiyin yo'qoladi.
 *
 * Shuning uchun ajratish ham satr ustida bajariladi.
 */
const GROUP = /\B(?=(\d{3})+(?!\d))/g;

export function formatMoney(amount: string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const negative = amount.startsWith('-');
  const digits = negative ? amount.slice(1) : amount;
  if (!/^\d+$/.test(digits)) return amount;
  return `${negative ? '-' : ''}${digits.replace(GROUP, ' ')} so'm`;
}
