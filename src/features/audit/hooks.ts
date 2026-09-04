import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditApi, type AuditFilters } from './api';

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters: AuditFilters) => ['audit', 'list', filters] as const,
  meta: ['audit', 'meta'] as const,
};

/**
 * `keepPreviousData` — filtr yoki sahifa o'zgarganda jadval bo'shab,
 * keyin qayta to'lmasin: eski qatorlar xira holda turadi va ekran
 * sakramaydi.
 */
export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => auditApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

/** Filtr lug'ati o'zgarmaydi — u kod bilan birga chiqadi. */
export function useAuditMeta() {
  return useQuery({
    queryKey: auditKeys.meta,
    queryFn: auditApi.meta,
    staleTime: Infinity,
  });
}
