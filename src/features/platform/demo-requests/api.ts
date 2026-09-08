import { api } from '@/shared/api/client';
import type { Paginated } from '@/shared/api/types';

export const DEMO_REQUEST_STATUSES = [
  'NEW',
  'CONTACTED',
  'CONVERTED',
  'REJECTED',
] as const;

export type DemoRequestStatus = (typeof DEMO_REQUEST_STATUSES)[number];

/**
 * Landing formasidan kelgan murojaat. `orgId` YO'Q va bo'lishi ham
 * mumkin emas: murojaat tashkilot yaratilishidan OLDIN keladi.
 */
export type DemoRequest = {
  id: string;
  fullName: string;
  phone: string;
  venueCount: number | null;
  city: string | null;
  comment: string | null;
  status: DemoRequestStatus;
  /** Platforma xodimining ichki izohi — mijozga ko'rsatilmaydi. */
  note: string | null;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
};

export type DemoRequestsQuery = {
  page?: number;
  pageSize?: number;
  status?: DemoRequestStatus;
};

export type UpdateDemoRequestInput = {
  status?: DemoRequestStatus;
  note?: string;
};

const ROOT = '/platform/demo-requests';

export const demoRequestsApi = {
  list: (query: DemoRequestsQuery) =>
    api
      .get<Paginated<DemoRequest>>(ROOT, { params: query })
      .then((r) => r.data),

  update: (id: string, input: UpdateDemoRequestInput) =>
    api.patch<DemoRequest>(`${ROOT}/${id}`, input).then((r) => r.data),
};
