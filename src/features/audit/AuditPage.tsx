import { useState } from 'react';
import { Alert, App, Empty, Skeleton, Table, Tooltip, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { formatDateTime } from '@/shared/format/time';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { useCan } from '@/features/auth/hooks';
import { figma } from '@/shared/theme/tokens';
import { auditApi, type AuditEntry } from './api';
import { useAuditLog, useAuditMeta } from './hooks';
import { AuditFilters, type FilterPatch } from './AuditFilters';
import { ChangesTable } from './ChangesTable';
import { entityPath } from './entity-link';

/**
 * M11 — audit jurnali.
 *
 * Jadval bitta, uning ustida filtrlar. Hisobotlardagidek tab'larga
 * bo'linmaydi: u yerda yettita TURLI jadval bor edi, bu yerda esa
 * bitta jadval va uning kesimlari.
 *
 * Filtrlar va sahifa URL da yashaydi — topilgan izni havola qilib
 * yuborish mumkin bo'lsin.
 */
export function AuditPage() {
  const can = useCan();
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [yuklanmoqda, setYuklanmoqda] = useState(false);

  const qiymat = (key: string) => searchParams.get(key) ?? undefined;
  const amallar = qiymat('action');

  const filters = {
    from: qiymat('from'),
    to: qiymat('to'),
    actorId: qiymat('actorId'),
    action: amallar === undefined ? undefined : amallar.split(','),
    entityType: qiymat('entityType'),
    page: Number(searchParams.get('page') ?? 1),
    pageSize: DEFAULT_PAGE_SIZE,
  };

  const meta = useAuditMeta();
  const jurnal = useAuditLog(filters);

  function patchParams(patch: Record<string, string | undefined>): void {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  // Filtr o'zgarganda sahifa boshiga qaytadi: uchinchi sahifada turib
  // filtrni torraytirsa, bo'sh jadval chiqardi.
  const filtrOzgardi = (patch: FilterPatch) =>
    patchParams({ ...patch, page: undefined });

  async function eksport(): Promise<void> {
    setYuklanmoqda(true);
    try {
      await auditApi.downloadCsv(filters);
    } catch (e: unknown) {
      message.error(errorMessage(e));
    } finally {
      setYuklanmoqda(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={2} style={{ margin: 0 }}>
        Audit jurnali
      </Typography.Title>

      <AuditFilters
        filters={filters}
        actions={meta.data?.actions ?? []}
        entityTypes={meta.data?.entityTypes ?? []}
        onChange={filtrOzgardi}
        // Eksport alohida ruxsat talab qiladi (backend `export.data`).
        onExport={can('export.data') ? () => void eksport() : null}
        exporting={yuklanmoqda}
      />

      {jurnal.error !== null ? (
        // Xato ko'pincha filtrdan keladi (oraliq 366 kundan uzun,
        // noma'lum amal turi) — shuning uchun filtrlar ekranda qoladi
        // va foydalanuvchi tanlovini tuzatishi mumkin.
        <Alert type="error" showIcon message={errorMessage(jurnal.error)} />
      ) : jurnal.isPending ? (
        <Skeleton active />
      ) : (
        <Table<AuditEntry>
          rowKey="id"
          dataSource={jurnal.data?.items ?? []}
          loading={jurnal.isFetching}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: <Empty description="Bu filtr bo‘yicha yozuv yo‘q" />,
          }}
          pagination={{
            current: jurnal.data?.page ?? 1,
            pageSize: jurnal.data?.pageSize ?? DEFAULT_PAGE_SIZE,
            total: jurnal.data?.total ?? 0,
            showSizeChanger: false,
            onChange: (page) =>
              patchParams({ page: page === 1 ? undefined : String(page) }),
          }}
          expandable={{
            // O'zgarishsiz yozuvda tugma chizilmaydi: bo'sh panel
            // ochilishi "ma'lumot yo'qoldi" degan taassurot qoldirardi.
            rowExpandable: (row) => row.changes.length > 0,
            expandedRowRender: (row) => <ChangesTable changes={row.changes} />,
          }}
          columns={[
            {
              title: 'Sana',
              dataIndex: 'createdAt',
              render: (iso: string) => formatDateTime(iso),
            },
            {
              title: 'Xodim',
              dataIndex: ['actor', 'name'],
              render: (_: unknown, row) =>
                row.actor?.name ?? (
                  <Typography.Text style={{ color: figma.textMuted }}>
                    Tizim
                  </Typography.Text>
                ),
            },
            { title: 'Amal', dataIndex: 'actionLabel' },
            {
              title: 'Obyekt',
              dataIndex: 'entityLabel',
              render: (label: string, row) => {
                const path = entityPath(row.entityType, row.entityId);
                return path === null ? (
                  <Tooltip title={row.entityId ?? undefined}>
                    <span>{label}</span>
                  </Tooltip>
                ) : (
                  <Link to={path}>{label}</Link>
                );
              },
            },
            {
              title: 'IP',
              dataIndex: 'ip',
              render: (ip: string | null) => (
                <Typography.Text style={{ color: figma.textMuted }}>
                  {ip ?? '—'}
                </Typography.Text>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
