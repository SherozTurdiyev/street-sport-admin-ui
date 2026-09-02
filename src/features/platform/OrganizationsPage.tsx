import { useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { formatDate, formatDateTime } from '@/shared/format/time';
import type {
  EffectiveStatus,
  OrganizationsQuery,
  PlatformOrganization,
} from './api';
import { OrganizationCardDrawer } from './OrganizationCardDrawer';
import { OrganizationFormModal } from './OrganizationFormModal';
import { STATUS_OPTIONS, STATUS_VIEW } from './status';
import { useOrganizations } from './hooks';

function buildColumns(
  onOpen: (id: string) => void,
): ColumnsType<PlatformOrganization> {
  return [
    {
      title: 'Tashkilot',
      dataIndex: 'name',
      render: (value: string, row: PlatformOrganization) => (
        <Button type="link" className="!px-0" onClick={() => onOpen(row.id)}>
          {value}
        </Button>
      ),
    },
    {
      // ATAYLAB `effectiveStatus`: `subscriptionStatus` bazadagi ustun va
      // u obuna sanasi o'tib ketganini bilmaydi.
      title: 'Holat',
      dataIndex: 'effectiveStatus',
      render: (value: EffectiveStatus) => (
        <Tag color={STATUS_VIEW[value].color}>{STATUS_VIEW[value].label}</Tag>
      ),
    },
    {
      title: 'Obuna tugashi',
      dataIndex: 'subscriptionEndsAt',
      render: (value: string | null) =>
        value ? formatDate(value) : 'Muddatsiz',
    },
    {
      title: 'Stadionlar',
      render: (_, row: PlatformOrganization) => row.stats.venueCount,
    },
    {
      title: 'Xodimlar',
      render: (_, row: PlatformOrganization) => row.stats.memberCount,
    },
    {
      title: 'Oxirgi faollik',
      render: (_, row: PlatformOrganization) =>
        formatDateTime(row.stats.lastActivityAt),
    },
  ];
}

export function OrganizationsPage() {
  const [query, setQuery] = useState<OrganizationsQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const { data, isFetching, error } = useOrganizations(query);

  function setFilter(patch: Partial<OrganizationsQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  return (
    <Card
      title="Tashkilotlar"
      extra={
        <Button type="primary" onClick={() => setFormOpen(true)}>
          Yangi tashkilot
        </Button>
      }
    >
      <Space className="mb-4" wrap>
        <Input.Search
          aria-label="Qidiruv"
          placeholder="Nom yoki telefon"
          allowClear
          onSearch={(value) => setFilter({ search: value || undefined })}
        />
        <Select
          aria-label="Holat bo'yicha filtr"
          className="w-48"
          placeholder="Holat"
          allowClear
          options={STATUS_OPTIONS}
          value={query.status}
          onChange={(value?: EffectiveStatus) => setFilter({ status: value })}
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

      <Table<PlatformOrganization>
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

      <OrganizationFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
      <OrganizationCardDrawer id={cardId} onClose={() => setCardId(null)} />
    </Card>
  );
}
