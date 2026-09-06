import { useState } from 'react';
import {
  Alert,
  Card,
  Empty,
  Input,
  Pagination,
  Select,
  Skeleton,
  Space,
  Typography,
} from 'antd';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { figma } from '@/shared/theme/tokens';
import { VenueCard } from '@/features/venues/VenueCard';
import {
  SPORT_TYPE_OPTIONS,
  VENUE_STATUS_OPTIONS,
  type SportType,
  type VenueStatus,
} from '@/features/venues/enums';
import type { PlatformVenue, PlatformVenuesQuery } from '../api';
import { usePlatformVenues } from '../hooks';
import { PlatformVenueLink } from './PlatformVenueLink';

/**
 * Barcha tashkilotlarning stadionlari bitta ro'yxatda. Kartochka
 * tashkilot ichidagi ro'yxat bilan bir xil (Figma 2009:4497), ustiga
 * bitta qator qo'shiladi — stadion kimniki.
 */
function OrgTag({ venue }: { venue: PlatformVenue }) {
  return (
    <Link
      to={`/platform/organizations/${venue.organization.id}`}
      className="truncate"
      style={{ color: figma.primaryBright, fontSize: 12 }}
    >
      {venue.organization.name}
    </Link>
  );
}

export function PlatformVenuesPage() {
  const [query, setQuery] = useState<PlatformVenuesQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data, isPending, isFetching, error } = usePlatformVenues(query);

  function setFilter(patch: Partial<PlatformVenuesQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  const items = data?.items ?? [];

  return (
    <Card className="sahifa-kartochka" title="Stadionlar">
      <Typography.Paragraph type="secondary">
        Barcha tashkilotlarning stadionlari. Yozuvlar faqat o‘qish uchun —
        o‘zgartirishni tashkilotning o‘z xodimlari kiritadi.
      </Typography.Paragraph>

      <Space className="filtr-qatori mb-6" wrap>
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
          className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4 sm:gap-6"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {items.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              meta={<OrgTag venue={venue} />}
              actions={<PlatformVenueLink venue={venue} />}
            />
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
    </Card>
  );
}
