import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';
import type { Booking } from '@/features/bookings/api';

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
 * `totalPaid` — mijoz jami to'lagan pul, `currentDebt` — bekor
 * qilinmagan bronlar bo'yicha qolgan qarzi. Ikkalasi ham to'lovlar
 * jadvalidan yig'iladi (M8).
 */
export type CustomerStats = {
  totalBookings: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  lastVisitAt: string | null;
  totalPaid: string;
  currentDebt: string;
};

export type CustomerCard = Customer & {
  stats: CustomerStats;
  /** Oxirgi bronlar, yangisidan eskisiga. */
  bookings: Booking[];
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

/** Telefon bu yerda YO'Q: u mijozning identifikatori va o'zgarmaydi. */
export type CustomerInput = {
  fullName?: string;
  note?: string | null;
  tags?: string[];
};

export type CreateCustomerInput = { phone: string; fullName: string };

export const customersApi = {
  lookup: (input: { phone: string; fullName?: string }) =>
    api.post<LookupResult>('/customers/lookup', input).then((r) => r.data),

  list: (query: CustomersQuery) =>
    api
      .get<Paginated<Customer>>('/customers', { params: query })
      .then((r) => r.data),

  card: (id: string) =>
    api.get<CustomerCard>(`/customers/${id}`).then((r) => r.data),

  create: (input: CreateCustomerInput) =>
    api.post<Customer>('/customers', input).then((r) => r.data),

  update: (id: string, input: CustomerInput) =>
    api.patch<Customer>(`/customers/${id}`, input).then((r) => r.data),

  blacklist: (id: string, isBlacklisted: boolean) =>
    api
      .patch<Customer>(`/customers/${id}/blacklist`, { isBlacklisted })
      .then((r) => r.data),
};
