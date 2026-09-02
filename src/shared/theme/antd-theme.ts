import { theme, type ThemeConfig } from 'antd';
import { figma } from './tokens';

/**
 * Butun interfeysning rangi shu yerdan keladi.
 *
 * `darkAlgorithm` ATAYLAB: u yuzlab hosila rangni (hover, disabled,
 * ajratuvchi chiziq, soya) o'zi hisoblaydi. Biz faqat Figma bergan
 * asosiy qiymatlarni beramiz — qolganini antd izchil qilib chiqaradi.
 * Har bir hosila rangni qo'lda yozish dizayn o'zgarganda uzilib qoladi.
 */
export const antdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: figma.primary,
    /**
     * Havola rangi ALOHIDA beriladi: antd standarti ko'k va u brend
     * palitrasidan tashqarida turadi. Brend binafshasining o'zi quyuq
     * fonda o'qilmaydi, shuning uchun yorug' varianti.
     */
    colorLink: figma.primaryBright,
    colorSuccess: figma.success,
    colorWarning: figma.warning,
    colorError: figma.danger,

    colorBgBase: figma.bg,
    colorBgContainer: figma.bgCard,
    colorBgElevated: figma.bgCard,
    colorBgLayout: figma.bg,

    colorBorder: figma.border,
    colorBorderSecondary: figma.border,

    colorText: figma.text,
    colorTextSecondary: figma.textMuted,
    colorTextTertiary: figma.textMuted,

    borderRadius: figma.radiusControl,
    borderRadiusLG: figma.radiusCard,

    fontFamily: figma.fontFamily,
  },
  components: {
    Layout: {
      siderBg: figma.bgSider,
      headerBg: figma.bgHeader,
      bodyBg: figma.bg,
      headerHeight: figma.headerHeight,
      headerPadding: '0 32px',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: figma.textMuted,
      itemHoverColor: figma.text,
      // Figma'da faol element — yumaloq binafsha tabletka.
      itemSelectedBg: figma.primarySoft,
      itemSelectedColor: figma.primary,
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
      primaryShadow: `0 4px 20px ${figma.primaryGlow}`,
    },
    Card: {
      colorBgContainer: figma.bgCard,
      borderRadiusLG: figma.radiusCard,
    },
    Modal: {
      contentBg: figma.bgCard,
      headerBg: figma.bgCard,
    },
    Input: { colorBgContainer: figma.bgInput },
    InputNumber: { colorBgContainer: figma.bgInput },
    Select: { colorBgContainer: figma.bgInput },
    Table: {
      headerBg: 'transparent',
      headerColor: figma.textMuted,
      rowHoverBg: figma.primarySoft,
      borderColor: figma.border,
    },
    Tag: { borderRadiusSM: figma.radiusPill },
  },
};
