import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';
import type { Booking, CancelReason } from '@/features/bookings/api';

/**
 * Seriya — "har dushanba va chorshanba 19:00 da, 4 hafta davomida"
 * degan yozuv. U ko'plab ALOHIDA bron yaratadi va har biri mustaqil
 * yashaydi: bittasini bekor qilish qolganiga tegmaydi.
 *
 * Chegara: 12 haftadan uzun bo'lmaydi (BR-10).
 */
export type Series = {
  id: string;
  venue: { id: string; name: string };
  customer: { id: string; phone: string; fullName: string };
  /** 1–7, dushanba = 1. */
  weekdays: number[];
  /** `HH:mm`, Toshkent vaqti. */
  startTime: string;
  startDate: string;
  endDate: string;
  /** So'm, SATR (BR-13). */
  pricePerHour: string;
};

export type SeriesStats = {
  totalCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  upcomingCount: number;
  /** M8 gacha har doim nol — interfeys ularni ko'rsatmaydi. */
  paidCount: number;
  totalDebt: string;
  pendingModule: 'M8';
};

export type SeriesCard = Series & {
  durationMinutes: number;
  stats: SeriesStats;
  bookings: Booking[];
};

export type SeriesQuery = PageQuery & {
  venueId?: string;
  customerId?: string;
  /** Shuncha kun ichida tugaydiganlar — uzaytirishni eslatish uchun. */
  expiringWithinDays?: number;
};

export const OCCURRENCE_VIEW = {
  FREE: { label: 'Bo‘sh', color: 'success' },
  BUSY: { label: 'Band', color: 'error' },
  OUTSIDE_HOURS: { label: 'Ish vaqtidan tashqari', color: 'warning' },
  CLOSED: { label: 'Stadion yopiq', color: 'default' },
} as const;

export type OccurrenceStatus = keyof typeof OCCURRENCE_VIEW;

export type Occurrence = {
  startsAt: string;
  endsAt: string;
  status: OccurrenceStatus;
};

export type PreviewInput = {
  venueId: string;
  weekdays: number[];
  /** `HH:mm`, Toshkent vaqti. */
  startTime: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
};

export type SeriesPreview = {
  total: number;
  free: number;
  pricePerHour: string;
  pricePerOccurrence: string;
  occurrences: Occurrence[];
};

/**
 * `onConflict`: `SKIP` — band sanalar o'tkazib yuboriladi;
 * `ABORT` — bitta band sana bo'lsa ham hech narsa yaratilmaydi.
 */
export type CreateSeriesInput = PreviewInput & {
  customerId: string;
  onConflict: 'SKIP' | 'ABORT';
};

export type CreatedSeries = {
  seriesId: string;
  pricePerHour: string;
  createdCount: number;
  /** `SKIP` rejimida yaratilmagan sanalar. */
  skipped: { startsAt: string; endsAt: string }[];
  bookings: Booking[];
};

export type ExtendInput = { weeks: number; onConflict: 'SKIP' | 'ABORT' };

export type ExtendedSeries = CreatedSeries & { endDate: string };

export type CancelSeriesInput = { reason: CancelReason; comment?: string };

export const seriesApi = {
  list: (query: SeriesQuery) =>
    api
      .get<Paginated<Series>>('/booking-series', { params: query })
      .then((r) => r.data),

  card: (id: string) =>
    api.get<SeriesCard>(`/booking-series/${id}`).then((r) => r.data),

  preview: (input: PreviewInput) =>
    api
      .post<SeriesPreview>('/booking-series/preview', input)
      .then((r) => r.data),

  create: (input: CreateSeriesInput) =>
    api.post<CreatedSeries>('/booking-series', input).then((r) => r.data),

  extend: (id: string, input: ExtendInput) =>
    api
      .post<ExtendedSeries>(`/booking-series/${id}/extend`, input)
      .then((r) => r.data),

  cancel: (id: string, input: CancelSeriesInput) =>
    api
      .post<{ cancelledCount: number }>(`/booking-series/${id}/cancel`, input)
      .then((r) => r.data),
};
