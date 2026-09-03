import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Alert, Card, Skeleton, Tabs } from 'antd';
import { useParams, useSearchParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { formatDateTime } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { StatCard } from '@/features/dashboard/StatCard';
import { useOrganization } from '../hooks';
import { OrganizationHero } from './OrganizationHero';
import { OrgProfileForm } from './OrgProfileForm';
import { OrgMembersTab, OrgVenuesTab } from './OrgTabs';

const TABS = ['profile', 'members', 'venues'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

export function OrganizationDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isPending, error } = useOrganization(id);

  const tab = isTab(searchParams.get('tab'))
    ? (searchParams.get('tab') as Tab)
    : 'profile';

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <OrganizationHero org={data} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4 sm:gap-6">
        <StatCard
          label="Stadionlar"
          icon={EnvironmentOutlined}
          tint={figma.primaryBright}
          value={data.stats.venueCount}
        />
        <StatCard
          label="Xodimlar"
          icon={TeamOutlined}
          tint={figma.success}
          value={data.stats.memberCount}
        />
        <StatCard
          label="Bronlar"
          icon={CalendarOutlined}
          tint={figma.warning}
          value={data.stats.bookingCount}
        />
        <StatCard
          label="Oxirgi faollik"
          icon={ClockCircleOutlined}
          tint={figma.textMuted}
          value={formatDateTime(data.stats.lastActivityAt)}
          hint="Oxirgi bron yaratilgan payt. Bo‘sh — tashkilot hali ishlatilmagan."
        />
      </div>

      <Card>
        {/* Manzildagi `tab` — havolani yuborish uchun: qo'llab-quvvatlash
            xodimi to'g'ridan-to'g'ri kerakli bo'limga yubora oladi. */}
        <Tabs
          activeKey={tab}
          onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
          items={[
            {
              key: 'profile',
              label: 'Profil',
              children: <OrgProfileForm org={data} />,
            },
            {
              key: 'members',
              label: 'Xodimlar',
              children: <OrgMembersTab id={id} />,
            },
            {
              key: 'venues',
              label: 'Stadionlar',
              children: <OrgVenuesTab id={id} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
