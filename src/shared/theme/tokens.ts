import { RANG_KALITLARI, varNomi, type RangKaliti } from './palitra';

/**
 * Komponentlar uchun YAGONA manba. Ranglar endi aniq qiymat emas, CSS
 * o'zgaruvchisi: joriy rejimni `<html>` belgilaydi (`features/theme/mavzu.ts`).
 *
 * Shuning uchun `figma.textMuted` yozilgan 39 ta faylning birortasiga
 * tegilmadi — ular baribir to'g'ri rangni oladi va rejim almashganda
 * React qayta chizmasdan yangilanadi.
 *
 * Haqiqiy qiymatlar `palitra.ts` da; antd mavzusi ularni o'sha yerdan
 * oladi, chunki algoritmga hex kerak.
 *
 * O'lchamlar va shrift Figma'dan (StreetSport, k8OXDrj1dxTlVP3yhjoeFW)
 * va rejimga bog'liq emas.
 */
const rang = Object.fromEntries(
  RANG_KALITLARI.map((kalit) => [kalit, `var(${varNomi(kalit)})`]),
) as Record<RangKaliti, string>;

export const figma = {
  ...rang,

  /** Karta va oynalar. */
  radiusCard: 20,
  /** Tugma, menyu elementi, belgi — Figma'da to'liq yumaloq. */
  radiusPill: 32,
  radiusControl: 12,

  siderWidth: 280,
  headerHeight: 88,

  /**
   * Shrift `index.html` da Google Fonts orqali yuklanadi. Zaxira
   * ro'yxati SHART: shrift kelmasa ham interfeys o'qilishi kerak.
   */
  fontFamily:
    "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const;
