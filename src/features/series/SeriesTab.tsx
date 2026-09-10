import { useState } from 'react';
import { Alert, Button, Checkbox, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { formatMoney } from '@/shared/format/money';
import { formatDate } from '@/shared/format/time';
import { useCan } from '@/features/auth/hooks';
import { WEEKDAYS } from '@/features/venues/enums';
import { useVenueOptions } from '@/features/venues/hooks';
import type { Series, SeriesQuery } from './api';
import { SeriesFormModal } from './SeriesFormModal';
import { useSeriesList } from './hooks';

const SHORT = new Map(WEEKDAYS.map((d) => [d.value, d.short]));

/** Tugash arafasidagilarni topish oynasi — uzaytirishni eslatish uchun. */
const EXPIRING_DAYS = 7;

export function SeriesTab() {
  const [query, setQuery] = useState<SeriesQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [formOpen, setFormOpen] = useState(false);
  const { data, isFetching, error } = useSeriesList(query);
  const venues = useVenueOptions(true);
  const can = useCan();

  function setFilter(patch: Partial<SeriesQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  const columns: ColumnsType<Series> = [
    {
      title: 'Mijoz',
      render: (_, row) => (
        <Link to={`/bookings/series/${row.id}`}>{row.customer.fullName}</Link>
      ),
    },
    {
      title: 'Stadion',
      responsive: ['md'],
      render: (_, row) => row.venue.name,
    },
    {
      title: 'Kunlar',
      responsive: ['sm'],
      dataIndex: 'weekdays',
      render: (value: number[]) =>
        value.length === 0
          ? 'Har kuni'
          : value.map((d) => SHORT.get(d)).join(', '),
    },
    { title: 'Vaqt', dataIndex: 'startTime' },
    {
      title: 'Davri',
      render: (_, row) =>
        `${formatDate(row.startDate)} – ${formatDate(row.endDate)}`,
    },
    {
      title: 'Soatiga',
      responsive: ['md'],
      dataIndex: 'pricePerHour',
      render: (value: string) => formatMoney(value),
    },
  ];

  return (
    <>
      <Space className="filtr-qatori mb-6" wrap>
        <Select
          aria-label="Stadion bo'yicha filtr"
          className="w-52"
          placeholder="Stadion"
          allowClear
          loading={venues.isPending}
          options={(venues.data ?? []).map((v) => ({
            value: v.id,
            label: v.name,
          }))}
          value={query.venueId}
          onChange={(value?: string) => setFilter({ venueId: value })}
        />
        <Checkbox
          onChange={(e) =>
            setFilter({
              expiringWithinDays: e.target.checked ? EXPIRING_DAYS : undefined,
            })
          }
        >
          Tugash arafasida
        </Checkbox>
        {can('booking.series.create') && (
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Yangi seriya
          </Button>
        )}
      </Space>

      {error === null ? null : (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={errorMessage(error)}
        />
      )}

      <Table<Series>
        rowKey="id"
        size="small"
        loading={isFetching}
        dataSource={data?.items ?? []}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => setQuery((prev) => ({ ...prev, page })),
        }}
      />

      <SeriesFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
