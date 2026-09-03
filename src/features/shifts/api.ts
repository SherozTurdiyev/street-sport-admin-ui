import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';

/**
 * Smena — kassirning ish kuni. Naqd to'lov faqat ochiq smena ichida
 * qabul qilinadi: aks holda naqd pulning bir qismi hech qaysi smenaga
 * tegishli bo'lmasdi va "kassada qancha bo'lishi kerak" degan savolga
 * javob bo'lmasdi.
 */

export const SHIFT_STATUS_VIEW = {
  OPEN: { label: 'Ochiq', color: 'processing' },
  CLOSED: { label: 'Yopilgan', color: 'default' },
} as const;

export type ShiftStatus = keyof typeof SHIFT_STATUS_VIEW;

export type Shift = {
  id: string;
  venueId: string;
  venueName: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt: string | null;
  /** Pul SATR (BR-13). */
  openingCash: string;
  /** Xodim sanagan. Yopilmagan smenada `null`. */
  declaredCash: string | null;
  /** Tizim hisoblagan. Yopilmagan smenada `null`. */
  systemCash: string | null;
  /** `declaredCash − systemCash`. Manfiy — kam, musbat — ortiqcha. */
  difference: string | null;
  comment: string | null;
  status: ShiftStatus;
};

/**
 * Ochiq smenaning oraliq hisobi. Kassir yopishdan OLDIN nima
 * kutilayotganini ko'radi — u baribir yopishda tizim sonini ko'radi,
 * yashirishning ma'nosi yo'q.
 */
export type CurrentShift = Shift & {
  expectedCash: string;
  cashPaymentTotal: string;
  cashRefundTotal: string;
  paymentCount: number;
};

export type ShiftsQuery = PageQuery & {
  venueId?: string;
  status?: ShiftStatus;
  from?: string;
  to?: string;
};

export type OpenShiftInput = { venueId: string; openingCash?: string };

export type CloseShiftInput = { declaredCash: string; comment?: string };

export const shiftsApi = {
  list: (query: ShiftsQuery) =>
    api.get<Paginated<Shift>>('/shifts', { params: query }).then((r) => r.data),

  /** Stadionda ochiq smena bo'lmasa `{ shift: null }` qaytadi. */
  current: (venueId: string) =>
    api
      .get<{ shift: CurrentShift | null }>('/shifts/current', {
        params: { venueId },
      })
      .then((r) => r.data.shift),

  card: (id: string) =>
    api.get<CurrentShift>(`/shifts/${id}`).then((r) => r.data),

  open: (input: OpenShiftInput) =>
    api.post<Shift>('/shifts/open', input).then((r) => r.data),

  close: (id: string, input: CloseShiftInput) =>
    api.post<Shift>(`/shifts/${id}/close`, input).then((r) => r.data),
};
