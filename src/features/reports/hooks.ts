import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reportsApi, type ReportRange } from './api';

export const reportKeys = {
  all: ['reports'] as const,
  summary: (range: ReportRange) => ['reports', 'summary', range] as const,
  venues: (range: ReportRange) => ['reports', 'venues', range] as const,
  methods: (range: ReportRange) => ['reports', 'methods', range] as const,
  occupancy: (range: ReportRange) => ['reports', 'occupancy', range] as const,
  cancellations: (range: ReportRange) =>
    ['reports', 'cancellations', range] as const,
  debtors: (query: object) => ['reports', 'debtors', query] as const,
  staff: (range: ReportRange) => ['reports', 'staff', range] as const,
};

/**
 * Har bir hisobot `enabled` bilan so'raladi: yopiq tab ma'lumot
 * yuklamaydi. Aks holda direktor sahifani ochishi bilan yettita
 * og'ir so'rov ketardi va oltitasi behuda bo'lardi.
 *
 * `keepPreviousData` — oraliq o'zgarganda jadval bo'shab, keyin qayta
 * to'lmasin: eski raqamlar xira holda turadi va ekran sakramaydi.
 */
export function useSummary(range: ReportRange, enabled = true) {
  return useQuery({
    queryKey: reportKeys.summary(range),
    queryFn: () => reportsApi.summary(range),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useRevenueByVenue(range: ReportRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.venues(range),
    queryFn: () => reportsApi.revenueByVenue(range),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useRevenueByMethod(range: ReportRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.methods(range),
    queryFn: () => reportsApi.revenueByMethod(range),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useOccupancy(range: ReportRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.occupancy(range),
    queryFn: () => reportsApi.occupancy(range),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCancellations(range: ReportRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.cancellations(range),
    queryFn: () => reportsApi.cancellations(range),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useDebtors(
  query: ReportRange & { page: number; pageSize: number },
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportKeys.debtors(query),
    queryFn: () => reportsApi.debtors(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useStaffReport(range: ReportRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.staff(range),
    queryFn: () => reportsApi.staff(range),
    enabled,
    placeholderData: keepPreviousData,
  });
}
