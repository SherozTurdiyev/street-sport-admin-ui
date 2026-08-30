/**
 * Marshrut, ruxsat va menyu nomi BITTA joyda. Ular ajralib qolsa,
 * menyuda ko'rinadigan, lekin ochilmaydigan bo'lim paydo bo'ladi —
 * foydalanuvchi uchun eng chalg'ituvchi holat.
 */
export type NavItem = {
  path: string;
  /** `null` — kirgan har bir foydalanuvchi ko'radi. */
  permission: string | null;
  label: string;
};

export const NAV: readonly NavItem[] = [
  { path: '/organization', permission: null, label: 'Tashkilot' },
  { path: '/members', permission: 'member.admin.manage', label: 'Xodimlar' },
];

export function allowedNav(
  can: (permission: string) => boolean,
): readonly NavItem[] {
  return NAV.filter((item) => item.permission === null || can(item.permission));
}
