import { useState } from 'react';
import { Alert, Card, Select, Space, Table, Tag, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { formatMoney } from '@/shared/format/money';
import { formatDateTime } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { useVenueOptions } from '@/features/venues/hooks';
import { SHIFT_STATUS_VIEW, type Shift, type ShiftStatus } from './api';
import { CurrentShiftCard } from './CurrentShiftCard';
import { useShifts } from './hooks';

const STATUS_OPTIONS = (Object.keys(SHIFT_STATUS_VIEW) as ShiftStatus[]).map(
  (value) => ({ value, label: SHIFT_STATUS_VIEW[value].label }),
);

/** Farq rangi: kam bo'lsa qizil, ortiqcha bo'lsa sariq, nol — oddiy. */
function Farq({ value }: { value: string | null }) {
  if (value === null) return <span style={{ color: figma.textMuted }}>—</span>;
  const nol = value === '0';
  const kam = value.startsWith('-');
  return (
    <span
      style={{
        color: nol ? figma.success : kam ? figma.danger : figma.warning,
        fontWeight: 700,
      }}
    >
      {nol ? formatMoney('0') : `${kam ? '' : '+'}${formatMoney(value)}`}
    </span>
  );
}

/**
 * Smenalar bo'limi: yuqorida joriy smena (kassirning ish o'rni),
 * pastda tarix.
 *
 * `shift.others.view` yo'q xodimga backend faqat O'ZINING smenalarini
 * qaytaradi — bu yerda alohida filtr yozilmaydi, aks holda ikki joyda
 * ikki xil qoida bo'lardi.
 */
export function ShiftsPage() {
  const [query, setQuery] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    venueId: undefined as string | undefined,
    status: undefined as ShiftStatus | undefined,
  });
  const stadionlar = useVenueOptions(true);
  const { data, isFetching, error } = useShifts(query);

  function setFilter(patch: Partial<typeof query>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <CurrentShiftCard />

      <Card title="Smenalar tarixi">
        <Space className="filtr-qatori mb-4" wrap>
          <Select
            aria-label="Stadion bo'yicha filtr"
            style={{ minWidth: 180 }}
            placeholder="Stadion"
            allowClear
            loading={stadionlar.isPending}
            value={query.venueId}
            onChange={(value?: string) => setFilter({ venueId: value })}
            options={(stadionlar.data ?? []).map((v) => ({
              value: v.id,
              label: v.name,
            }))}
          />
          <Select
            aria-label="Holat bo'yicha filtr"
            style={{ minWidth: 150 }}
            placeholder="Holat"
            allowClear
            value={query.status}
            onChange={(value?: ShiftStatus) => setFilter({ status: value })}
            options={STATUS_OPTIONS}
          />
        </Space>

        {error === null ? null : (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message={errorMessage(error)}
          />
        )}

        <Table<Shift>
          rowKey="id"
          scroll={{ x: 'max-content' }}
          loading={isFetching}
          dataSource={data?.items ?? []}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total: data?.total ?? 0,
            showSizeChanger: false,
            onChange: (page) => setQuery((prev) => ({ ...prev, page })),
          }}
          columns={[
            {
              title: 'Stadion',
              dataIndex: 'venueName',
              render: (value: string, row) => (
                <div className="min-w-0">
                  <Typography.Text strong>{value}</Typography.Text>
                  <div style={{ color: figma.textMuted, fontSize: 12 }}>
                    {row.userName}
                  </div>
                </div>
              ),
            },
            {
              title: 'Ochilgan',
              responsive: ['md'],
              dataIndex: 'openedAt',
              render: (value: string) => formatDateTime(value),
            },
            {
              title: 'Yopilgan',
              responsive: ['lg'],
              dataIndex: 'closedAt',
              render: (value: string | null) =>
                value === null ? '—' : formatDateTime(value),
            },
            {
              title: 'Sanalgan',
              responsive: ['md'],
              dataIndex: 'declaredCash',
              render: (value: string | null) =>
                value === null ? '—' : formatMoney(value),
            },
            {
              title: 'Tizim',
              responsive: ['lg'],
              dataIndex: 'systemCash',
              render: (value: string | null) =>
                value === null ? '—' : formatMoney(value),
            },
            {
              title: 'Farq',
              dataIndex: 'difference',
              render: (value: string | null) => <Farq value={value} />,
            },
            {
              title: 'Holat',
              dataIndex: 'status',
              render: (value: ShiftStatus) => (
                <Tag color={SHIFT_STATUS_VIEW[value].color}>
                  {SHIFT_STATUS_VIEW[value].label}
                </Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
