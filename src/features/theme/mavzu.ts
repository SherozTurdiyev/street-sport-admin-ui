import {
  PALITRA,
  RANG_KALITLARI,
  varNomi,
  type Rejim,
} from '@/shared/theme/palitra';

/** Foydalanuvchi tanlovi — backenddagi `uiTheme` bilan bir xil. */
export type MavzuTanlovi = 'DARK' | 'LIGHT' | 'SYSTEM';

export const MAVZU_KALIT = 'ss-mavzu';

const TANLOVLAR: readonly MavzuTanlovi[] = ['DARK', 'LIGHT', 'SYSTEM'];

export function tanlovMi(x: unknown): x is MavzuTanlovi {
  return typeof x === 'string' && (TANLOVLAR as readonly string[]).includes(x);
}

/**
 * `localStorage` — tezkor xotira, haqiqat manbai emas: server qiymati
 * `/auth/me` bilan kelgach ustun turadi. Xususiy rejimda yoki sayt
 * ma'lumoti bloklanganda o'qish TASHLAYDI, shuning uchun har murojaat
 * `try/catch` ichida.
 */
export function saqlanganTanlov(): MavzuTanlovi {
  try {
    const x = window.localStorage.getItem(MAVZU_KALIT);
    return tanlovMi(x) ? x : 'DARK';
  } catch {
    return 'DARK';
  }
}

export function tanlovniYoz(tanlov: MavzuTanlovi): void {
  try {
    window.localStorage.setItem(MAVZU_KALIT, tanlov);
  } catch {
    // Saqlanmasa, tanlov faqat shu sahifa uchun ishlaydi.
  }
}

const TIZIM_SOROVI = '(prefers-color-scheme: dark)';

export function tizimRejimi(): Rejim {
  try {
    return window.matchMedia(TIZIM_SOROVI).matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

/** `useSyncExternalStore` uchun obuna. */
export function tizimgaObuna(ozgardi: () => void): () => void {
  const mql = window.matchMedia(TIZIM_SOROVI);
  mql.addEventListener('change', ozgardi);
  return () => mql.removeEventListener('change', ozgardi);
}

export function hisobla(tanlov: MavzuTanlovi, tizim: Rejim): Rejim {
  if (tanlov === 'SYSTEM') return tizim;
  return tanlov === 'LIGHT' ? 'light' : 'dark';
}

/**
 * Ranglarni `<html>` ga qo'yadi. React qayta chizmaydi — brauzer
 * o'zgaruvchi o'zgarganda o'zi qayta bo'yaydi, shuning uchun almashish
 * bir zumda bo'ladi.
 */
export function qolla(rejim: Rejim): void {
  const el = document.documentElement;
  el.dataset.theme = rejim;
  // Skrollbar va brauzerning o'z elementlari ham mos bo'lishi uchun.
  el.style.colorScheme = rejim;
  for (const kalit of RANG_KALITLARI) {
    el.style.setProperty(varNomi(kalit), PALITRA[rejim][kalit]);
  }
}
