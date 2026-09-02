/**
 * Telefon raqami — O'zbekiston: `+998` va 9 ta raqam (2 ta operator
 * kodi, 7 ta abonent raqami). Maska: `+998 (90) 000-00-00`.
 *
 * MODELDA raqam doim E.164 ko'rinishida qoladi — `+998901234567`.
 * Backend shuni kutadi va foydalanuvchi shu bilan tizimga kiradi;
 * qavs va chiziqcha faqat ko'rinish uchun, forma qiymatiga tushmaydi.
 */
const CODE = '998';

/** Maydondagi joy egasi — maskaning o'zi. */
export const PHONE_PLACEHOLDER = '+998 (90) 000-00-00';

/** Xom matndan MILLIY raqam (kodsiz 9 ta raqam). */
export function phoneDigits(raw: string): string {
  const hammasi = raw.replace(/\D/g, '');
  /*
   * Xom matn maskadan keladi, ya'ni deyarli doim `998` bilan
   * boshlanadi. Faqat BITTASI olib tashlanadi: `+998 (99) 8...`
   * raqamida ham qolgani abonent raqami bo'lib qoladi.
   */
  const milliy = hammasi.startsWith(CODE)
    ? hammasi.slice(CODE.length)
    : hammasi;
  return milliy.slice(0, 9);
}

/** Milliy raqamni maska ko'rinishiga soladi. To'liq bo'lmasa ham. */
export function formatPhone(nat: string): string {
  if (nat === '') return '';
  let out = `+${CODE} (${nat.slice(0, 2)}`;
  if (nat.length > 2) out += `) ${nat.slice(2, 5)}`;
  if (nat.length > 5) out += `-${nat.slice(5, 7)}`;
  if (nat.length > 7) out += `-${nat.slice(7, 9)}`;
  return out;
}

/** Forma saqlaydigan qiymat: E.164 yoki bo'sh satr. */
export function phoneValue(raw: string): string {
  const nat = phoneDigits(raw);
  return nat === '' ? '' : `+${CODE}${nat}`;
}

/**
 * Ko'rsatish uchun. O'zbekiston raqami bo'lmasa (chet el, qisqa raqam)
 * qiymat o'zgarishsiz qaytadi — noto'g'ri maska kiyintirishdan afzal.
 */
export function displayPhone(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const d = value.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith(CODE)) return formatPhone(d.slice(3));
  if (d.length === 9 && !value.includes('+')) return formatPhone(d);
  return value;
}
