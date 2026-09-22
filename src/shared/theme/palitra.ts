/**
 * Ikkala rejimning RANGLARI — yagona manba.
 *
 * Bu yerdagi qiymatlar komponentlarda TO'G'RIDAN-TO'G'RI ishlatilmaydi:
 * ular ikki joyga boradi — antd mavzusi (`antd-theme.ts`, unga haqiqiy
 * hex kerak: algoritm yuzlab hosila rangni hisoblaydi) va CSS
 * o'zgaruvchilari (`features/theme/mavzu.ts`, ularni `tokens.ts`
 * orqali komponentlar o'qiydi).
 *
 * Qorong'i qiymatlar Figma'dan (StreetSport, k8OXDrj1dxTlVP3yhjoeFW).
 * Yorug' qiymatlar Figma'da YO'Q — ular shu ishda tanlandi va
 * kontrasti `palitra.test.ts` da o'lchanadi.
 */
export type Rejim = 'dark' | 'light';

export const RANG_KALITLARI = [
  'primary',
  'primarySoft',
  'primarySoftBorder',
  'primaryGlow',
  'primaryBright',
  'bg',
  'bgSider',
  'bgHeader',
  'bgCard',
  'bgCardSoft',
  'bgDeep',
  'bgInput',
  'border',
  'text',
  'textMuted',
  'success',
  'warning',
  'danger',
] as const;

export type RangKaliti = (typeof RANG_KALITLARI)[number];

export const PALITRA: Record<Rejim, Record<RangKaliti, string>> = {
  dark: {
    primary: '#5a00db',
    primarySoft: 'rgba(90, 0, 219, 0.2)',
    primarySoftBorder: 'rgba(90, 0, 219, 0.3)',
    primaryGlow: 'rgba(90, 0, 219, 0.5)',
    // Quyuq fonda brend binafshasi o'qilmaydi — yorug' varianti.
    primaryBright: '#974cff',
    bg: '#130726',
    bgSider: '#110524',
    bgHeader: '#0e041d',
    bgCard: '#1b0c36',
    // Yarim shaffof karta: ostidagi gradient va fon ko'rinib turadi.
    bgCardSoft: 'rgba(27, 12, 54, 0.6)',
    // Gradientning eng quyuq nuqtasi (kirish sahifasi).
    bgDeep: '#0b0219',
    bgInput: '#2c1c48',
    border: '#2d1a53',
    text: '#ffffff',
    textMuted: '#a18fc3',
    success: '#00e676',
    warning: '#fdc700',
    danger: '#fb2c36',
  },
  light: {
    primary: '#5a00db',
    primarySoft: 'rgba(90, 0, 219, 0.12)',
    primarySoftBorder: 'rgba(90, 0, 219, 0.25)',
    primaryGlow: 'rgba(90, 0, 219, 0.35)',
    // Yorug' fonda brend binafshasining o'zi yetarli (8.54).
    primaryBright: '#5a00db',
    bg: '#f4f2f8',
    bgSider: '#ffffff',
    bgHeader: '#ffffff',
    bgCard: '#ffffff',
    bgCardSoft: 'rgba(255, 255, 255, 0.72)',
    bgDeep: '#e7e1f3',
    bgInput: '#f0edf6',
    border: '#ded7ee',
    text: '#1a1033',
    textMuted: '#615777',
    // Qorong'i rejimdagi neon qiymatlar oq fonda ~1.5 kontrast beradi
    // va o'qilmaydi, shuning uchun quyuqroq variantlari.
    success: '#00733c',
    warning: '#8a5a00',
    danger: '#c1121f',
  },
};

/**
 * Testda o'lchanadigan matn/fon juftliklari.
 *
 * Shaffof ranglar (`primarySoft`) va faqat fon sifatida ishlatiladigan
 * qiymatlar bu yerda YO'Q: ularning ustiga matn yozilmaydi.
 *
 * `primaryBright` ham yo'q: qorong'i rejimda u karta ustida 4.16 beradi,
 * ya'ni AA dan past. Bu avvaldan mavjud nuqson (spec §4.2) va uni
 * tuzatish ko'rinishni o'zgartiradigan alohida dizayn qarori.
 */
export const KONTRAST_JUFTLARI: readonly [RangKaliti, RangKaliti][] = [
  ['text', 'bg'],
  ['text', 'bgCard'],
  ['text', 'bgSider'],
  ['text', 'bgInput'],
  ['text', 'bgDeep'],
  ['textMuted', 'bgDeep'],
  ['textMuted', 'bg'],
  ['textMuted', 'bgCard'],
  ['success', 'bgCard'],
  ['warning', 'bgCard'],
];

/** `textMuted` -> `--rang-text-muted`. */
export function varNomi(kalit: RangKaliti): string {
  return `--rang-${kalit.replace(/[A-Z]/g, (h) => `-${h.toLowerCase()}`)}`;
}
