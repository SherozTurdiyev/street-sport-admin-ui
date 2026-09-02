import { useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import type { Venue, VenuesQuery } from './api';
import {
  SPORT_TYPE_LABELS,
  SPORT_TYPE_OPTIONS,
  VENUE_STATUS_OPTIONS,
  VENUE_STATUS_VIEW,
  type SportType,
  type VenueStatus,
} from './enums';
import { VenueCardDrawer } from './VenueCardDrawer';
import { VenueFormModal } from './VenueFormModal';
import { useVenues } from './hooks';

function buildColumns(onOpen: (id: string) => void): ColumnsType<Venue> {
  return [
    {
      title: 'Nomi',
      dataIndex: 'name',
      render: (value: string, row: Venue) => (
        <Button type="link" className="!px-0" onClick={() => onOpen(row.id)}>
          {value}
        </Button>
      ),
    },
    {
      title: 'Sport turi',
      dataIndex: 'sportType',
      render: (value: SportType) => SPORT_TYPE_LABELS[value],
    },
    { title: 'Shahar', dataIndex: 'city' },
    {
      title: 'Holat',
      dataIndex: 'status',
      render: (value: VenueStatus) => (
        <Tag color={VENUE_STATUS_VIEW[value].color}>
          {VENUE_STATUS_VIEW[value].label}
        </Tag>
      ),
    },
    {
      title: 'Bron qadami',
      dataIndex: 'slotMinutes',
      render: (value: number) => `${value} daq.`,
    },
  ];
}

export function VenuesPage() {
  const [query, setQuery] = useState<VenuesQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const { data, isFetching, error } = useVenues(query);

  function setFilter(patch: Partial<VenuesQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  return (
    <Card
      title="Stadionlar"
      extra={
        <Button type="primary" onClick={() => setFormOpen(true)}>
          Yangi stadion
        </Button>
      }
    >
      <Space className="mb-4" wrap>
        <Input.Search
          aria-label="Qidiruv"
          placeholder="Nomi bo‘yicha"
          allowClear
          onSearch={(value) => setFilter({ search: value || undefined })}
        />
        <Input.Search
          aria-label="Shahar"
          placeholder="Shahar"
          allowClear
          onSearch={(value) => setFilter({ city: value || undefined })}
        />
        <Select
          aria-label="Sport turi bo'yicha filtr"
          className="w-48"
          placeholder="Sport turi"
          allowClear
          options={SPORT_TYPE_OPTIONS}
          value={query.sportType}
          onChange={(value?: SportType) => setFilter({ sportType: value })}
        />
        <Select
          aria-label="Holat bo'yicha filtr"
          className="w-44"
          placeholder="Holat"
          allowClear
          options={VENUE_STATUS_OPTIONS}
          value={query.status}
          onChange={(value?: VenueStatus) => setFilter({ status: value })}
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

      <Table<Venue>
        rowKey="id"
        columns={buildColumns(setCardId)}
        dataSource={data?.items ?? []}
        loading={isFetching}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total: data?.total ?? 0,
          showSizeChanger: false,
        }}
        onChange={(pagination) =>
          setQuery((prev) => ({
            ...prev,
            page: pagination.current ?? 1,
            pageSize: pagination.pageSize ?? DEFAULT_PAGE_SIZE,
          }))
        }
      />

      <VenueFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <VenueCardDrawer venueId={cardId} onClose={() => setCardId(null)} />
    </Card>
  );
}
