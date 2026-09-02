import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Pagination,
  Select,
  Skeleton,
  Space,
} from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import type { VenuesQuery } from './api';
import {
  SPORT_TYPE_OPTIONS,
  VENUE_STATUS_OPTIONS,
  type SportType,
  type VenueStatus,
} from './enums';
import { VenueCard } from './VenueCard';
import { VenueFormModal } from './VenueFormModal';
import { useVenues } from './hooks';

export function VenuesPage() {
  const [query, setQuery] = useState<VenuesQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [formOpen, setFormOpen] = useState(false);
  const { data, isPending, isFetching, error } = useVenues(query);

  function setFilter(patch: Partial<VenuesQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  const items = data?.items ?? [];

  return (
    <Card
      title="Stadionlar"
      extra={
        <Button type="primary" onClick={() => setFormOpen(true)}>
          Yangi stadion
        </Button>
      }
    >
      <Space className="mb-6" wrap>
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

      {isPending ? (
        <Skeleton active />
      ) : items.length === 0 ? (
        <Empty description="Stadion topilmadi" />
      ) : (
        <div
          // Panjara ekran kengligiga qarab o'zi moslashadi: ustunlar
          // soni qotirilsa, tor oynada kartochka siqilib ketardi.
          className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {items.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}

      {(data?.total ?? 0) > (query.pageSize ?? DEFAULT_PAGE_SIZE) && (
        <Pagination
          className="mt-6 text-right"
          align="end"
          current={query.page}
          pageSize={query.pageSize}
          total={data?.total ?? 0}
          showSizeChanger={false}
          onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        />
      )}

      <VenueFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </Card>
  );
}
