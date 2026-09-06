import { useState } from 'react';
import { Alert, DatePicker, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { formatMoney } from '@/shared/format/money';
import { figma } from '@/shared/theme/tokens';
import { formatDateTime, formatTime } from '@/shared/format/time';
import { displayPhone } from '@/shared/format/phone';
import { useVenueOptions } from '@/features/venues/hooks';
import {
  BOOKING_STATUS_VIEW,
  type BookingListItem,
  type BookingStatus,
  type BookingsQuery,
} from './api';
import { useBookings } from './hooks';

const STATUS_OPTIONS = Object.entries(BOOKING_STATUS_VIEW).map(
  ([value, view]) => ({ value, label: view.label }),
);

/**
 * Ro'yxat kalendarga qo'shimcha: kalendar bitta kunni ko'rsatadi,
 * bu yerda esa oralig'i bo'yicha qidiriladi — "o'tgan oyda shu mijoz
 * necha marta o'ynagan?" degan savolga javob.
 */
export function BookingsTable({
  onOpen,
}: {
  onOpen: (booking: BookingListItem) => void;
}) {
  const [query, setQuery] = useState<BookingsQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data, isFetching, error } = useBookings(query);
  const venues = useVenueOptions(true);

  function setFilter(patch: Partial<BookingsQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  const columns: ColumnsType<BookingListItem> = [
    {
      title: 'Vaqt',
      dataIndex: 'startsAt',
      render: (_, row) =>
        `${formatDateTime(row.startsAt)} – ${formatTime(row.endsAt)}`,
    },
    { title: 'Stadion', responsive: ['md'], render: (_, row) => row.venue.name },
    {
      title: 'Mijoz',
      render: (_, row) =>
        row.customer === null ? 'Anonim' : row.customer.fullName,
    },
    {
      title: 'Telefon',
      responsive: ['lg'],
      render: (_, row) => displayPhone(row.customer?.phone),
    },
    {
      title: 'Narx',
      dataIndex: 'priceTotal',
      render: (value: string) => formatMoney(value),
    },
    {
      // Qarz ustuni ATAYLAB narx yonida: operator "kim to'lamagan?"
      // degan savolga ro'yxatning o'zidan javob topsin.
      title: 'Qarz',
      responsive: ['sm'],
      dataIndex: 'debt',
      render: (value: string) =>
        value === '0' ? (
          <Tag color="success">To‘langan</Tag>
        ) : (
          <span style={{ color: figma.danger, fontWeight: 700 }}>
            {formatMoney(value)}
          </span>
        ),
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      render: (value: BookingStatus) => (
        <Tag color={BOOKING_STATUS_VIEW[value].color}>
          {BOOKING_STATUS_VIEW[value].label}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <Space className="filtr-qatori mb-6" wrap>
        <Input.Search
          aria-label="Qidiruv"
          placeholder="Mijoz ismi yoki telefoni"
          allowClear
          onSearch={(value) => setFilter({ search: value || undefined })}
        />
        <Select
          aria-label="Holat bo'yicha filtr"
          className="w-44"
          placeholder="Holat"
          allowClear
          options={STATUS_OPTIONS}
          value={query.status}
          onChange={(value?: BookingStatus) => setFilter({ status: value })}
        />
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
        <DatePicker.RangePicker
          aria-label="Sana oralig'i"
          onChange={(range) => {
            const [from, to] = (range ?? []) as (Dayjs | null)[];
            setFilter({
              from: from?.startOf('day').toISOString(),
              to: to?.endOf('day').toISOString(),
            });
          }}
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

      <Table<BookingListItem>
        rowKey="id"
        size="small"
        loading={isFetching}
        dataSource={data?.items ?? []}
        columns={columns}
        scroll={{ x: 'max-content' }}
        onRow={(row) => ({ onClick: () => onOpen(row) })}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => setQuery((prev) => ({ ...prev, page })),
        }}
      />
    </>
  );
}
