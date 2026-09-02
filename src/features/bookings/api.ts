import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';

/**
 * Bron obyekti — barcha bron endpoint'lari aynan shu shaklni qaytaradi
 * (`docs/API.md`, 11-bo'lim).
 *
 * Vaqt oralig'i YARIM OCHIQ `[startsAt, endsAt)`: 19:00–20:00 va
 * 20:00–21:00 to'qnashmaydi.
 */
export type Booking = {
  id: string;
  venueId: string;
  customerId: string;
  seriesId: string | null;
  startsAt: string;
  endsAt: string;
  /** Pul SATR (BR-13) — `Number` ga o'girilmaydi. */
  priceTotal: string;
  discount: string;
  status: BookingStatus;
  source: 'PANEL' | 'PUBLIC' | 'IMPORT';
  cancelReason: string | null;
  createdAt: string;
};

export const BOOKING_STATUS_VIEW = {
  PENDING: { label: 'Kutilmoqda', color: 'default' },
  CONFIRMED: { label: 'Tasdiqlangan', color: 'processing' },
  COMPLETED: { label: 'Yakunlangan', color: 'success' },
  NO_SHOW: { label: 'Kelmadi', color: 'warning' },
  CANCELLED: { label: 'Bekor qilingan', color: 'error' },
} as const;

export type BookingStatus = keyof typeof BOOKING_STATUS_VIEW;

export type BookingsQuery = PageQuery & {
  search?: string;
  status?: BookingStatus;
  venueId?: string;
  /** ISO UTC. */
  from?: string;
  to?: string;
};

/**
 * F6.10 — bosh sahifadagi panel.
 *
 * `todayRevenue` va `unpaidCount` M8 (to'lovlar) gacha vaqtinchalik
 * manbadan hisoblanadi; `pendingModule` shuni ochiq aytadi va ekranda
 * ham aytilishi kerak — aks holda direktor to'liq bo'lmagan raqamga
 * qarab qaror qabul qilardi.
 */
export type TodayPanel = {
  /** Toshkent sanasi, `YYYY-MM-DD`. */
  date: string;
  /** Eng yaqin uchta bron. */
  nextGames: Booking[];
  todayRevenue: string;
  unpaidCount: number;
  freeHours: number;
  pendingModule: 'M8';
};

export const bookingsApi = {
  search: (query: BookingsQuery) =>
    api
      .get<Paginated<Booking>>('/bookings', { params: query })
      .then((r) => r.data),

  todayPanel: () =>
    api.get<TodayPanel>('/bookings/today-panel').then((r) => r.data),
};
