import {
  BankOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons';
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
  /**
   * Ruxsat yetarli emas: platforma xodimida `orgId` YO'Q va tashkilot
   * ma'lumotini so'rasa backend haqli ravishda `NOT_FOUND` qaytaradi.
   * Platforma bo'limlari qo'shilganda ular `false` bilan keladi.
   */
  requiresOrg: boolean;
};

export const NAV: readonly NavItem[] = [
  {
    // BIRINCHI o'rin ataylab: `/` shu ro'yxatdagi birinchi ochiq
    // bo'limga yo'naltiradi, ya'ni tashkilot xodimi kirgach boshqaruv
    // paneliga tushadi.
    path: '/dashboard',
    permission: null,
    label: 'Boshqaruv paneli',
    icon: DashboardOutlined,
    requiresOrg: true,
  },
  {
    path: '/organization',
    permission: null,
    label: 'Tashkilot',
    icon: ShopOutlined,
    requiresOrg: true,
  },
  {
    path: '/members',
    permission: 'member.admin.manage',
    label: 'Xodimlar',
    icon: TeamOutlined,
    requiresOrg: true,
  },
  {
    path: '/venues',
    // Ko'rish uchun alohida ruxsat yo'q — kirgan har bir xodim o'ziga
    // ochiq stadionlarni ko'radi (BR-08 backendda cheklaydi).
    permission: null,
    label: 'Stadionlar',
    icon: EnvironmentOutlined,
    requiresOrg: true,
  },
  {
    // Platforma bo'limi: tashkilotga a'zolik TALAB QILINMAYDI —
    // `SUPER_ADMIN` da `orgId` yo'q.
    path: '/platform/organizations',
    permission: 'platform.org.manage',
    label: 'Tashkilotlar',
    icon: BankOutlined,
    requiresOrg: false,
  },
];

export function allowedNav(
  can: (permission: string) => boolean,
  hasOrg: boolean,
): readonly NavItem[] {
  return NAV.filter(
    (item) =>
      (!item.requiresOrg || hasOrg) &&
      (item.permission === null || can(item.permission)),
  );
}
