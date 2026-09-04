import { api } from '@/shared/api/client';
import { downloadBlob } from '@/shared/api/download';
import type { PaymentMethod } from '@/features/payments/api';

/**
 * M10 — hisobotlar.
 *
 * Daromad KASSA asosida hisoblanadi: shu davrda qabul qilingan
 * to'lovlardan qaytarishlar ayriladi. Bron qilingan-u to'lanmagan pul
 * daromadda emas, qarzdorlik hisobotida turadi.
 *
 * Barcha pul maydonlari — SATR (BR-13). `Number` ga o'girilmaydi.
 */

export type ReportRange = {
  from?: string;
  to?: string;
  venueIds?: string[];
};

/** Bir davr: summa, oldingi davr va o'sish. */
export type RevenueBlock = {
  revenue: string;
  previous: string;
  /**
   * `null` — oldingi davrda tushum nol bo'lgan. Noldan o'sishning
   * foizi aniqlanmagan, shuning uchun backend son o'ylab topmaydi va
   * adminka ham uni to'ldirmaydi.
   */
  growthPercent: number | null;
};

export type Summary = {
  today: RevenueBlock;
  week: RevenueBlock;
  month: RevenueBlock;
};

export type VenueRevenue = {
  venueId: string;
  venueName: string;
  revenue: string;
  sharePercent: number;
};

export type MethodRevenue = {
  method: PaymentMethod;
  amount: string;
  sharePercent: number;
};

export type RangedReport<T> = {
  from: string;
  to: string;
  total: string;
  items: T[];
};

export type OccupancyStat = {
  openHours: number;
  bookedHours: number;
  occupancyPercent: number;
};

export type Occupancy = {
  from: string;
  to: string;
  totals: OccupancyStat;
  byVenue: ({ venueId: string; venueName: string } & OccupancyStat)[];
  byHour: ({ hour: number } & OccupancyStat)[];
};

export type Cancellations = {
  from: string;
  to: string;
  totals: {
    bookings: number;
    cancelled: number;
    noShow: number;
    cancelRatePercent: number;
  };
  byReason: { reason: string; count: number }[];
  byVenue: {
    venueId: string;
    venueName: string;
    cancelled: number;
    noShow: number;
  }[];
  byStaff: { userId: string; userName: string; cancelled: number }[];
};

export type Debtor = {
  /** `null` — anonim bron: kimdan so'rashni tizim bilmaydi. */
  customerId: string | null;
  customerName: string | null;
  phone: string | null;
  debt: string;
  bookingCount: number;
  oldestDebtDays: number;
};

export type Debtors = {
  totals: {
    total: string;
    upTo7Days: string;
    from7To30Days: string;
    over30Days: string;
    bookingCount: number;
  };
  items: Debtor[];
  total: number;
  page: number;
  pageSize: number;
};

export type StaffRow = {
  userId: string;
  userName: string;
  bookingsCreated: number;
  bookingsCancelled: number;
  paymentsReceived: string;
  refundsIssued: string;
  shiftsClosed: number;
  /** Manfiy — kassada pul yetishmagani. */
  cashDifference: string;
};

export type StaffReport = { from: string; to: string; items: StaffRow[] };

export type ReportName =
  | 'summary'
  | 'revenue-by-venue'
  | 'revenue-by-method'
  | 'occupancy'
  | 'cancellations'
  | 'debtors'
  | 'staff';

/** Hisobot nomidan backend yo'liga. */
const PATHS: Record<ReportName, string> = {
  summary: '/reports/summary',
  'revenue-by-venue': '/reports/revenue/by-venue',
  'revenue-by-method': '/reports/revenue/by-method',
  occupancy: '/reports/occupancy',
  cancellations: '/reports/cancellations',
  debtors: '/reports/debtors',
  staff: '/reports/staff',
};

function params(range: ReportRange): Record<string, string> {
  const out: Record<string, string> = {};
  if (range.from !== undefined) out.from = range.from;
  if (range.to !== undefined) out.to = range.to;
  if (range.venueIds !== undefined && range.venueIds.length > 0) {
    out.venueIds = range.venueIds.join(',');
  }
  return out;
}

export const reportsApi = {
  summary: (range: ReportRange) =>
    api
      .get<Summary>(PATHS.summary, { params: params(range) })
      .then((r) => r.data),

  revenueByVenue: (range: ReportRange) =>
    api
      .get<RangedReport<VenueRevenue>>(PATHS['revenue-by-venue'], {
        params: params(range),
      })
      .then((r) => r.data),

  revenueByMethod: (range: ReportRange) =>
    api
      .get<RangedReport<MethodRevenue>>(PATHS['revenue-by-method'], {
        params: params(range),
      })
      .then((r) => r.data),

  occupancy: (range: ReportRange) =>
    api
      .get<Occupancy>(PATHS.occupancy, { params: params(range) })
      .then((r) => r.data),

  cancellations: (range: ReportRange) =>
    api
      .get<Cancellations>(PATHS.cancellations, { params: params(range) })
      .then((r) => r.data),

  debtors: (query: ReportRange & { page?: number; pageSize?: number }) =>
    api
      .get<Debtors>(PATHS.debtors, {
        params: {
          ...params(query),
          ...(query.page === undefined ? {} : { page: query.page }),
          ...(query.pageSize === undefined ? {} : { pageSize: query.pageSize }),
        },
      })
      .then((r) => r.data),

  staff: (range: ReportRange) =>
    api
      .get<StaffReport>(PATHS.staff, { params: params(range) })
      .then((r) => r.data),

  /** CSV: `Authorization` kerak, shuning uchun blob orqali (`downloadBlob`). */
  async downloadCsv(name: ReportName, range: ReportRange): Promise<void> {
    const response = await api.get<Blob>(PATHS[name], {
      params: { ...params(range), format: 'csv' },
      responseType: 'blob',
    });

    downloadBlob(response, `hisobot-${name}.csv`);
  },
};
