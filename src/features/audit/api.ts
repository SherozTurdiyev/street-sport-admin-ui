import { api } from '@/shared/api/client';
import { downloadBlob } from '@/shared/api/download';
import type { Paginated } from '@/shared/api/types';

/**
 * M11 — audit jurnali.
 *
 * Barcha tarjimalar (`actionLabel`, `entityLabel`, `changes[].label`)
 * BACKENDDAN tayyor holda keladi. Adminka o'z lug'atini yuritmaydi:
 * CSV faylini ham backend yasaydi, ikkita lug'at esa bir kun kelib
 * bir-biridan farq qilardi.
 */

export type AuditChange = {
  field: string;
  label: string;
  /** `null` — yaratishda eski qiymat yo'q edi. */
  old: string | null;
  /** `null` — o'chirishda yangi qiymat yo'q. */
  new: string | null;
};

export type AuditEntry = {
  id: string;
  createdAt: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityLabel: string;
  entityId: string | null;
  /** `null` — tizim yozgan amal yoki o'chirilgan foydalanuvchi. */
  actor: { id: string; name: string } | null;
  ip: string | null;
  changes: AuditChange[];
};

export type AuditFilters = {
  from?: string;
  to?: string;
  actorId?: string;
  /** Bir nechta amal: so'rovda vergul bilan ketadi. */
  action?: string[];
  entityType?: string;
  entityId?: string;
  page?: number;
  pageSize?: number;
};

export type AuditOption = { value: string; label: string };
export type AuditMeta = {
  actions: AuditOption[];
  entityTypes: AuditOption[];
};

function params(filters: AuditFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (filters.from !== undefined) out.from = filters.from;
  if (filters.to !== undefined) out.to = filters.to;
  if (filters.actorId !== undefined) out.actorId = filters.actorId;
  if (filters.action !== undefined && filters.action.length > 0) {
    out.action = filters.action.join(',');
  }
  if (filters.entityType !== undefined) out.entityType = filters.entityType;
  if (filters.entityId !== undefined) out.entityId = filters.entityId;
  if (filters.page !== undefined) out.page = filters.page;
  if (filters.pageSize !== undefined) out.pageSize = filters.pageSize;
  return out;
}

export const auditApi = {
  list: (filters: AuditFilters) =>
    api
      .get<Paginated<AuditEntry>>('/audit-log', { params: params(filters) })
      .then((r) => r.data),

  meta: () => api.get<AuditMeta>('/audit-log/meta').then((r) => r.data),

  async downloadCsv(filters: AuditFilters): Promise<void> {
    const response = await api.get<Blob>('/audit-log', {
      // Sahifa ATAYLAB uzatilmaydi: eksport filtrga mos yozuvlarni
      // to'liq oladi, joriy sahifani emas.
      params: { ...params({ ...filters, page: undefined }), format: 'csv' },
      responseType: 'blob',
    });

    downloadBlob(response, 'audit-jurnali.csv');
  },
};
