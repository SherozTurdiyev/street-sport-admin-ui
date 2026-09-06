import { useState } from 'react';
import {
  ArrowRightOutlined,
  BankOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
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
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { displayPhone } from '@/shared/format/phone';
import { formatDate } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { useIsMobile } from '@/shared/ui/useIsMobile';
import { StatCard } from '@/features/dashboard/StatCard';
import type {
  EffectiveStatus,
  OrganizationsQuery,
  PlatformOrganization,
} from './api';
import { OrganizationCard } from './OrganizationCard';
import { OrganizationFormModal } from './OrganizationFormModal';
import { STATUS_OPTIONS, STATUS_VIEW } from './status';
import { useOrganizations } from './hooks';

/**
 * Figma (2003:2489): olti ustun — tashkilot (nom + raqam), aloqa,
 * holat, hajm, obuna va amallar.
 *
 * Matn ATAYLAB oq: quyuq fonda ikkilamchi kulrang qatorlar o'qilmasdi.
 * Ierarxiya rang bilan emas, o'lcham va joylashuv bilan beriladi.
 */
const CELL = { color: figma.text } as const;

function buildColumns(): ColumnsType<PlatformOrganization> {
  return [
    {
      title: 'Tashkilot',
      dataIndex: 'name',
      render: (value: string, row: PlatformOrganization) => (
        <div style={CELL}>
          <Link to={`/platform/organizations/${row.id}`}>
            <Typography.Text strong style={CELL}>
              {value}
            </Typography.Text>
          </Link>
          {/* Qisqa raqam — qo'llab-quvvatlashda tashkilotni og'zaki
              aytish uchun: to'liq UUID ni telefonda o'qib bo'lmaydi. */}
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            ORG-{row.id.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      title: 'Aloqa',
      responsive: ['md'],
      dataIndex: 'phone',
      render: (value: string | null) => (
        <span style={CELL}>
          {value === null ? (
            '—'
          ) : (
            <>
              <PhoneOutlined aria-hidden /> {displayPhone(value)}
            </>
          )}
        </span>
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
      title: 'Hajmi',
      responsive: ['sm'],
      render: (_, row: PlatformOrganization) => (
        <span style={CELL}>
          {row.stats.venueCount} stadion · {row.stats.memberCount} xodim
        </span>
      ),
    },
    {
      title: 'Obuna',
      responsive: ['md'],
      dataIndex: 'subscriptionEndsAt',
      render: (value: string | null) => (
        <span style={CELL}>{value ? formatDate(value) : 'Muddatsiz'}</span>
      ),
    },
    {
      title: '',
      render: (_, row: PlatformOrganization) => (
        <Tooltip title="Ochish">
          <Link to={`/platform/organizations/${row.id}`}>
            <Button
              type="text"
              aria-label={`${row.name} — ochish`}
              icon={<ArrowRightOutlined aria-hidden />}
            />
          </Link>
        </Tooltip>
      ),
    },
  ];
}

export function OrganizationsPage() {
  const [query, setQuery] = useState<OrganizationsQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [formOpen, setFormOpen] = useState(false);
  const { data, isPending, isFetching, error } = useOrganizations(query);
  const isMobile = useIsMobile();

  function setFilter(patch: Partial<OrganizationsQuery>): void {
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  const items = data?.items ?? [];
  // Sahifadagi jami — butun platforma bo'yicha emas, shuni ochiq
  // aytish kerak, aks holda ikki raqam bir-biriga zid ko'rinardi.
  const faolStadionlar = items.reduce(
    (sum, org) => sum + org.stats.venueCount,
    0,
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4 sm:gap-6">
        <StatCard
          label="Jami tashkilotlar"
          icon={BankOutlined}
          tint={figma.primaryBright}
          loading={isPending}
          value={data?.total ?? 0}
        />
        <StatCard
          label="Stadionlar"
          icon={EnvironmentOutlined}
          tint={figma.success}
          loading={isPending}
          value={faolStadionlar}
          hint="Shu sahifadagi tashkilotlar bo‘yicha yig‘indi."
        />
      </div>

      <Card
        title="Tashkilotlar"
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Yangi tashkilot
          </Button>
        }
      >
        <Space className="filtr-qatori mb-4" wrap>
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

        {isMobile ? (
          isPending ? (
            <Skeleton active />
          ) : items.length === 0 ? (
            <Empty description="Tashkilot topilmadi" />
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((org) => (
                <OrganizationCard key={org.id} org={org} />
              ))}
            </div>
          )
        ) : (
          <Table<PlatformOrganization>
            scroll={{ x: 'max-content' }}
            rowKey="id"
            columns={buildColumns()}
            dataSource={items}
            loading={isFetching}
            pagination={false}
          />
        )}

        {(data?.total ?? 0) > (query.pageSize ?? DEFAULT_PAGE_SIZE) && (
          <Pagination
            className="mt-6"
            align="end"
            current={query.page}
            pageSize={query.pageSize}
            total={data?.total ?? 0}
            showSizeChanger={false}
            onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
          />
        )}

        <OrganizationFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
        />
      </Card>
    </div>
  );
}
