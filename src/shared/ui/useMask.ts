import { useEffect, useRef, type ChangeEvent } from 'react';
import type { InputRef } from 'antd';

/**
 * Maskali maydonlarning umumiy qismi — telefon ham, summa ham shundan
 * foydalanadi.
 *
 * Ikkita qiymat bor va ular ATAYLAB ajratilgan:
 *   - MODEL — forma saqlaydigan va serverga ketadigan toza qiymat
 *     (`+998901234567`, `200000`);
 *   - KO'RINISH — maydonda ko'rinadigan matn (`+998 (90) 111-00-01`,
 *     `200 000`).
 * Server hech qachon bo'sh joy yoki qavs ko'rmaydi.
 *
 * Eng nozik joyi — kursor. Qiymat har bosishda qayta chizilganda
 * brauzer kursorni matn oxiriga tashlaydi, ya'ni raqamning o'rtasini
 * tuzatib bo'lmasdi. Shuning uchun kursor RAQAMLAR SONI bilan
 * o'lchanadi: o'zgarishdan oldin kursorgacha nechta raqam bo'lsa,
 * yangi matnda ham shuncha raqamdan keyin turadi.
 */

function raqammi(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9';
}

function raqamlarSoni(text: string, at: number): number {
  let n = 0;
  for (let i = 0; i < at && i < text.length; i += 1)
    if (raqammi(text[i])) n += 1;
  return n;
}

function raqamdanKeyin(text: string, n: number): number {
  if (n <= 0) return 0;
  let korilgan = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (!raqammi(text[i])) continue;
    korilgan += 1;
    if (korilgan === n) return i + 1;
  }
  return text.length;
}

type Args = {
  /** Forma qiymati. */
  value: string;
  onChange: (next: string) => void;
  /** Xom matndan model qiymatini oladi. */
  parse: (raw: string) => string;
  /** Model qiymatidan ko'rinadigan matn. */
  render: (value: string) => string;
  /**
   * Ko'rinishdagi O'ZGARMAS raqamlar soni — telefonda `998` uchun 3.
   * Ular ustida Backspace hech narsa o'chirmasligi kerak.
   */
  fixed?: number;
};

export function useMask({ value, onChange, parse, render, fixed = 0 }: Args) {
  const ref = useRef<InputRef>(null);
  const kursor = useRef<number | null>(null);
  const view = render(value);

  useEffect(() => {
    const pos = kursor.current;
    kursor.current = null;
    if (pos !== null) ref.current?.setSelectionRange(pos, pos);
  });

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    let raw = e.target.value;
    let at = e.target.selectionStart ?? raw.length;
    let next = parse(raw);

    if (
      next === value &&
      raw.length < view.length &&
      raqamlarSoni(raw, at) > fixed
    ) {
      /*
       * Foydalanuvchi ajratgichni — qavs yoki chiziqchani — o'chirdi.
       * Raqamlar o'zgarmagani uchun maydon qotib qolgandek ko'rinardi:
       * Backspace bosiladi, hech narsa yo'qolmaydi. Shuning uchun
       * chapdagi eng yaqin RAQAM o'chiriladi — foydalanuvchi aynan
       * shuni kutadi.
       */
      let i = at - 1;
      while (i >= 0 && !raqammi(raw[i])) i -= 1;
      if (i >= 0) {
        raw = raw.slice(0, i) + raw.slice(i + 1);
        at = i;
        next = parse(raw);
      }
    }

    /*
     * Ko'rinish DOIM o'zgarmas raqamlar bilan boshlanadi (`+998`), xom
     * matn esa faqat maydon bo'sh bo'lmaganda ularni saqlaydi. Birinchi
     * raqam yozilganda shu farq hisobga olinmasa, kursor mamlakat kodi
     * ichiga tushib qolardi va keyingi raqamlar aralashib ketardi.
     */
    const oldin = raqamlarSoni(raw, at) + (view === '' ? fixed : 0);
    kursor.current = raqamdanKeyin(render(next), oldin);
    onChange(next);
  }

  return { ref, view, handleChange };
}
