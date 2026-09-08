import {
  BankOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  CalendarOutlined,
  ContactsOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  ShopOutlined,
  TeamOutlined,
  WalletOutlined,
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
    // Yagona bo'lim: HAMMAGA ochiq. `requiresOrg: false` — platforma
    // xodimida tashkilot yo'q, lekin uning ham paneli bor va u
    // tashkilot ma'lumotini so'ramaydi (`PlatformDashboard`).
    path: '/dashboard',
    permission: null,
    label: 'Boshqaruv paneli',
    icon: DashboardOutlined,
    requiresOrg: false,
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
    // Kalendar boshqaruv panelidan keyin: administratorning kunlik ishi
    // shu yerda boshlanadi.
    path: '/bookings',
    permission: null,
    label: 'Bronlar',
    icon: CalendarOutlined,
    requiresOrg: true,
  },
  {
    // Kassa bronlardan keyin: kunlik oqim "bron → to'lov → smena
    // yopish" tartibida ketadi.
    path: '/shifts',
    permission: 'shift.own.view',
    label: 'Smenalar',
    icon: WalletOutlined,
    requiresOrg: true,
  },
  {
    /*
     * `report.debtors` — hisobotlar ichidagi ENG KENG ruxsat: u uchala
     * rolda ham bor. Ya'ni bo'lim menyuda kimga ko'rinsa, ichida hech
     * bo'lmasa bitta tab ochiladi. Torroq ruxsat (masalan
     * `report.profit.total`) qo'yilsa, administrator o'zining qarzdorlar
     * hisobotini umuman topa olmasdi.
     */
    path: '/reports',
    permission: 'report.debtors',
    label: 'Hisobotlar',
    icon: BarChartOutlined,
    requiresOrg: true,
  },
  {
    /*
     * Jurnal hisobotlardan keyin: ikkalasi ham "nima bo'ldi" degan
     * savolga javob beradi, lekin biri raqamlar, ikkinchisi izlar
     * bilan. `audit.view` faqat direktorda (TZ 4.3).
     */
    path: '/audit',
    permission: 'audit.view',
    label: 'Audit jurnali',
    icon: FileSearchOutlined,
    requiresOrg: true,
  },
  {
    // Mijoz bazasi bron bilan yonma-yon: kalendardan ochilgan kartochka
    // shu bo'limdagi sahifaga olib boradi.
    path: '/customers',
    permission: null,
    label: 'Mijozlar',
    icon: ContactsOutlined,
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
    // Platforma bo'limi: tashkilotga a'zolik TALAB QILINMAYDI —
    // `SUPER_ADMIN` da `orgId` yo'q.
    path: '/platform/organizations',
    permission: 'platform.org.manage',
    label: 'Tashkilotlar',
    icon: BankOutlined,
    requiresOrg: false,
  },
  {
    // Landing formasidan kelgan demo so'rovlari. Bu StreetSport ning
    // O'Z sotuv ma'lumoti, mijoz tashkilotining ishi emas.
    path: '/platform/demo-requests',
    permission: 'platform.org.manage',
    label: 'Murojaatlar',
    icon: InboxOutlined,
    requiresOrg: false,
  },
  {
    // Platforma xodimi uchun BARCHA tashkilotlarning stadionlari.
    // Manzil `/venues` dan ayri: u tashkilot ichidagi ro'yxat va
    // boshqa endpointga boradi.
    path: '/platform/venues',
    permission: 'platform.org.manage',
    label: 'Stadionlar',
    icon: EnvironmentOutlined,
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
