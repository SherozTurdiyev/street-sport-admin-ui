import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';

export type Customer = {
  id: string;
  phone: string;
  fullName: string;
  note: string | null;
  /** Erkin yorliqlar: `VIP`, `NAQD` va hokazo (F5.5). */
  tags: string[];
  /** Bron yaratishni TAQIQLAMAYDI — faqat ogohlantiradi. */
  isBlacklisted: boolean;
  createdAt: string;
};

/**
 * Kassadagi asosiy oqim: telefon kiritiladi va bitta chaqiruvda javob
 * keladi.
 *
 * `customer: null` — raqam topilmadi va ism berilmagani uchun yangi
 * mijoz YARATILMADI. Bu xato emas: interfeys shu paytda ism so'raydi va
 * qayta chaqiradi.
 */
export type LookupResult = { created: boolean; customer: Customer | null };

export type CustomersQuery = PageQuery & {
  search?: string;
  blacklistedOnly?: boolean;
};

export const customersApi = {
  lookup: (input: { phone: string; fullName?: string }) =>
    api.post<LookupResult>('/customers/lookup', input).then((r) => r.data),

  list: (query: CustomersQuery) =>
    api
      .get<Paginated<Customer>>('/customers', { params: query })
      .then((r) => r.data),
};
