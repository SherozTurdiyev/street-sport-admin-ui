import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Alert, Card, Skeleton, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { formatDate } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import type {
  EffectiveStatus,
  PlatformOrganization,
} from '@/features/platform/api';
import { useOrganizations, usePlatformVenues } from '@/features/platform/hooks';
import { STATUS_VIEW } from '@/features/platform/status';
import { StatCard } from './StatCard';

/** Ro'yxat `createdAt desc` bo'yicha keladi — birinchi sahifa eng yangisi. */
const RECENT = 5;

/** Faqat SON kerak bo'lganda: bitta yozuv so'raladi, `total` olinadi. */
const COUNT_ONLY = { page: 1, pageSize: 1 } as const;

/**
 * Platforma xodimining boshqaruv paneli.
 *
 * Bu yerda BRON, TUSHUM va MIJOZ yo'q — TZ 4.2 bo'yicha platforma
 * tashkilotning ish ma'lumotiga kira olmaydi. Ko'rsatiladigan narsa
 * tuzilma: nechta tashkilot bor, ular qanday holatda va nechta stadion
 * ochilgan.
 */
export function PlatformDashboard() {
  const songgi = useOrganizations({ page: 1, pageSize: RECENT });
  const faol = useOrganizations({ ...COUNT_ONLY, status: 'ACTIVE' });
  const muddati = useOrganizations({ ...COUNT_ONLY, status: 'EXPIRED' });
  const bloklangan = useOrganizations({ ...COUNT_ONLY, status: 'SUSPENDED' });
  const stadionlar = usePlatformVenues(COUNT_ONLY);

  const xato =
    songgi.error ??
    faol.error ??
    muddati.error ??
    bloklangan.error ??
    stadionlar.error;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Boshqaruv paneli
        </Typography.Title>
        <Typography.Text style={{ color: figma.textMuted }}>
          Platforma bo‘yicha umumiy holat.
        </Typography.Text>
      </div>

      {xato === null || xato === undefined ? null : (
        <Alert type="error" showIcon message={errorMessage(xato)} />
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
        <StatCard
          label="Jami tashkilot"
          icon={BankOutlined}
          tint={figma.primaryBright}
          loading={songgi.isPending}
          value={songgi.data?.total ?? 0}
        />
        <StatCard
          label="Faol"
          icon={CheckCircleOutlined}
          tint={figma.success}
          loading={faol.isPending}
          value={faol.data?.total ?? 0}
        />
        <StatCard
          label="Muddati tugagan"
          icon={ClockCircleOutlined}
          tint={figma.warning}
          loading={muddati.isPending}
          value={muddati.data?.total ?? 0}
          // Bu son bazadagi ustundan emas, AMALDAGI holatdan: obuna
          // sanasi hech kim tegmasdan o'tib ketadi.
          hint="Obuna muddati o‘tib ketgan tashkilotlar. Ular hali bloklanmagan, lekin faqat o‘qish rejimida."
        />
        <StatCard
          label="Bloklangan"
          icon={StopOutlined}
          tint={figma.danger}
          loading={bloklangan.isPending}
          value={bloklangan.data?.total ?? 0}
        />
        <StatCard
          label="Stadionlar"
          icon={EnvironmentOutlined}
          tint={figma.textMuted}
          loading={stadionlar.isPending}
          value={stadionlar.data?.total ?? 0}
        />
      </div>

      <Card
        title="So‘nggi tashkilotlar"
        extra={<Link to="/platform/organizations">Barchasi</Link>}
      >
        {songgi.isPending ? (
          <Skeleton active />
        ) : (
          <Table<PlatformOrganization>
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={songgi.data?.items ?? []}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Tashkilot',
                dataIndex: 'name',
                render: (value: string, row) => (
                  <Link to={`/platform/organizations/${row.id}`}>{value}</Link>
                ),
              },
              {
                title: 'Holat',
                dataIndex: 'effectiveStatus',
                render: (value: EffectiveStatus) => (
                  <Tag color={STATUS_VIEW[value].color}>
                    {STATUS_VIEW[value].label}
                  </Tag>
                ),
              },
              {
                title: 'Stadion',
                render: (_, row) => row.stats.venueCount,
              },
              {
                title: 'Xodim',
                render: (_, row) => row.stats.memberCount,
              },
              {
                title: 'Qo‘shilgan',
                dataIndex: 'createdAt',
                render: (value: string) => formatDate(value),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
