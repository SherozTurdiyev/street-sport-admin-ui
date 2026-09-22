import { theme, type ThemeConfig } from 'antd';
import { PALITRA, type Rejim } from './palitra';
import { figma } from './tokens';

/**
 * Butun interfeysning rangi shu yerdan keladi.
 *
 * Algoritm (`dark`/`default`) yuzlab hosila rangni (hover, disabled,
 * ajratuvchi chiziq, soya) o'zi hisoblaydi. Biz faqat asosiy
 * qiymatlarni beramiz — qolganini antd izchil qilib chiqaradi.
 *
 * Bu yerda HAQIQIY hex kerak: algoritm rang ustida hisob qiladi va
 * `tokens.ts` dagi CSS o'zgaruvchilari unga yaramaydi.
 */
export function antdTheme(rejim: Rejim): ThemeConfig {
  const rang = PALITRA[rejim];
  return {
    algorithm: rejim === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: rang.primary,
      /**
       * Havola rangi ALOHIDA beriladi: antd standarti ko'k va u brend
       * palitrasidan tashqarida turadi. Brend binafshasining o'zi quyuq
       * fonda o'qilmaydi, shuning uchun yorug' varianti.
       */
      colorLink: rang.primaryBright,
      colorSuccess: rang.success,
      colorWarning: rang.warning,
      colorError: rang.danger,

      colorBgBase: rang.bg,
      colorBgContainer: rang.bgCard,
      colorBgElevated: rang.bgCard,
      colorBgLayout: rang.bg,

      colorBorder: rang.border,
      colorBorderSecondary: rang.border,

      colorText: rang.text,
      colorTextSecondary: rang.textMuted,
      colorTextTertiary: rang.textMuted,

      borderRadius: figma.radiusControl,
      borderRadiusLG: figma.radiusCard,

      fontFamily: figma.fontFamily,
    },
    components: {
      Layout: {
        siderBg: rang.bgSider,
        headerBg: rang.bgHeader,
        bodyBg: rang.bg,
        headerHeight: figma.headerHeight,
        headerPadding: '0 32px',
      },
      Menu: {
        itemBg: 'transparent',
        itemColor: rang.textMuted,
        itemHoverColor: rang.text,
        // Figma'da faol element — yumaloq binafsha tabletka.
        itemSelectedBg: rang.primarySoft,
        itemSelectedColor: rang.primary,
        itemBorderRadius: figma.radiusPill,
        itemHeight: 50,
        itemMarginInline: 16,
        itemPaddingInline: 17,
        iconMarginInlineEnd: 12,
        fontSize: 16,
      },
      Button: {
        borderRadius: figma.radiusPill,
        borderRadiusLG: figma.radiusPill,
        borderRadiusSM: figma.radiusPill,
        primaryShadow: `0 4px 20px ${rang.primaryGlow}`,
      },
      Card: {
        colorBgContainer: rang.bgCard,
        borderRadiusLG: figma.radiusCard,
      },
      Modal: {
        contentBg: rang.bgCard,
        headerBg: rang.bgCard,
      },
      Input: { colorBgContainer: rang.bgInput },
      InputNumber: { colorBgContainer: rang.bgInput },
      Select: { colorBgContainer: rang.bgInput },
      Table: {
        headerBg: 'transparent',
        // Sarlavha ham OQ: quyuq fonda kulrang matn o'qilmasdi.
        // Ierarxiya rang bilan emas, o'lcham va qalinlik bilan beriladi.
        headerColor: rang.text,
        colorText: rang.text,
        rowHoverBg: rang.primarySoft,
        borderColor: rang.border,
      },
      Tag: { borderRadiusSM: figma.radiusPill },
    },
  };
}
