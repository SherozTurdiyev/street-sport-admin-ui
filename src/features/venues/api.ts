import { api } from '@/shared/api/client';
import type { Paginated } from '@/shared/api/types';

/**
 * Stadion obyektining ATAYLAB kichik bo'lagi: xodimga stadion
 * biriktirishda faqat nom va id kerak. To'liq stadion bo'limi keyingi
 * bosqichda quriladi va o'z tipini o'zi e'lon qiladi.
 */
export type VenueOption = { id: string; name: string };

export const venuesApi = {
  // Backend `pageSize` ni 100 bilan cheklaydi. Bitta tashkilotda undan
  // ko'p stadion bo'lsa, bu ro'yxat qidiruvli variantga almashtiriladi.
  options: () =>
    api
      .get<Paginated<VenueOption>>('/venues', { params: { pageSize: 100 } })
      .then((r) => r.data.items),
};
