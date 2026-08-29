/**
 * Barcha bo'limlar uchun umumiy shakllar. Backend ro'yxatlarni har doim
 * shu ko'rinishda qaytaradi, shuning uchun har bir bo'lim o'zi
 * takrorlamaydi.
 */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** Backend standartlari: berilmasa `page=1`, `pageSize=20`, maksimum 100. */
export type PageQuery = {
  page?: number;
  pageSize?: number;
};

export const DEFAULT_PAGE_SIZE = 20;

export type Role = 'SUPER_ADMIN' | 'DIRECTOR' | 'MANAGER' | 'VENUE_ADMIN';

/**
 * Rol FAQAT ekranda ko'rsatish uchun. Qaror qabul qilishda ishlatilmaydi —
 * buning uchun `permissions` bor (TZ 4.4).
 */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Platforma xodimi',
  DIRECTOR: 'Direktor',
  MANAGER: 'Menejer',
  VENUE_ADMIN: 'Administrator',
};
