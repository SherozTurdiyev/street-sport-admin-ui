/**
 * Figma'dan olingan qiymatlar — YAGONA manba.
 *
 * Fayl: StreetSport (k8OXDrj1dxTlVP3yhjoeFW). Figma'da o'zgaruvchi
 * (design token) e'lon qilinmagan, shuning uchun qiymatlar tugunlardan
 * ko'chirildi va renderdan piksel bo'yicha tasdiqlandi.
 *
 * Bu yerdagi ranglar komponentlarda TO'G'RIDAN-TO'G'RI ishlatilmaydi:
 * ular antd mavzusiga uzatiladi (`antd-theme.ts`) va komponentlar rangni
 * antd dan oladi. Aks holda dizayn o'zgarganda o'nlab faylni qidirish
 * kerak bo'lardi.
 */
export const figma = {
  /** Brend binafshasi: tugmalar, faol menyu, urg'u. */
  primary: '#5a00db',
  /** Faol menyu elementi va belgi fonlari uchun shaffof variantlar. */
  primarySoft: 'rgba(90, 0, 219, 0.2)',
  primarySoftBorder: 'rgba(90, 0, 219, 0.3)',
  primaryGlow: 'rgba(90, 0, 219, 0.5)',

  /** Asosiy maydon foni. */
  bg: '#130726',
  /** Yon panel va sarlavha — asosiy maydondan quyuqroq. */
  bgSider: '#110524',
  bgHeader: '#0e041d',
  /** Karta va jadval foni. Figma'da 60% shaffoflik + blur. */
  bgCard: '#1b0c36',
  /** Kiritish maydonlari. */
  bgInput: '#2c1c48',

  border: '#2d1a53',

  text: '#ffffff',
  textMuted: '#a18fc3',

  success: '#00e676',
  warning: '#fdc700',
  danger: '#fb2c36',

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
