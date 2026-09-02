import { ShopOutlined, TeamOutlined } from '@ant-design/icons';
import type { ComponentType } from 'react';

/**
 * Marshrut, ruxsat, nom va belgi BITTA joyda. Ular ajralib qolsa,
 * menyuda ko'rinadigan, lekin ochilmaydigan bo'lim paydo bo'ladi —
 * foydalanuvchi uchun eng chalg'ituvchi holat.
 */
/**
 * `aria-hidden` SHART: antd ikonkasi o'z nomini (`aria-label="shop"`)
 * e'lon qiladi va u menyu elementining nomiga qo'shilib ketadi. Ikonka
 * bezak — ma'noni yorliq matni tashiydi.
 */
export type NavIcon = ComponentType<{ 'aria-hidden'?: boolean }>;

export type NavItem = {
  path: string;
  /** `null` — kirgan har bir foydalanuvchi ko'radi. */
  permission: string | null;
  label: string;
  /**
   * Komponentning O'ZI saqlanadi, JSX emas — shunda bu fayl oddiy `.ts`
   * bo'lib qoladi va faqat ma'lumot jadvali bo'lib xizmat qiladi.
   */
  icon: NavIcon;
};

export const NAV: readonly NavItem[] = [
  {
    path: '/organization',
    permission: null,
    label: 'Tashkilot',
    icon: ShopOutlined,
  },
  {
    path: '/members',
    permission: 'member.admin.manage',
    label: 'Xodimlar',
    icon: TeamOutlined,
  },
];

export function allowedNav(
  can: (permission: string) => boolean,
): readonly NavItem[] {
  return NAV.filter((item) => item.permission === null || can(item.permission));
}
