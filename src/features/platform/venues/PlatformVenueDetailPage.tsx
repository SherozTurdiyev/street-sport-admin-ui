import {
  Alert,
  Card,
  Descriptions,
  Empty,
  Image,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { Link, useParams, useSearchParams } from 'react-router';
import { assetUrl } from '@/shared/api/client';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDate, formatDateTime } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { WEEKDAYS } from '@/features/venues/enums';
import type { VenueClosure, VenueHours } from '@/features/venues/api';
import type { PriceRule } from '@/features/venues/prices/api';
import { VenueHero } from '@/features/venues/detail/VenueHero';
import { VenueSpecs } from '@/features/venues/detail/VenueSpecs';
import type { PlatformVenueCard } from '../api';
import { usePlatformVenue } from '../hooks';

const TABS = ['prices', 'photos', 'closures'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

const SHORT = new Map(WEEKDAYS.map((d) => [d.value, d.short]));

/** Yopiq kun serverdan UMUMAN kelmaydi — bu yerda "Yopiq" bo'lib chiziladi. */
function WeeklyHours({ hours }: { hours: VenueHours[] }) {
  const byDay = new Map(hours.map((h) => [h.weekday, h]));
  return (
    <Descriptions column={1} size="small">
      {WEEKDAYS.map(({ value, label }) => {
        const day = byDay.get(value);
        return (
          <Descriptions.Item key={value} label={label}>
            {day ? (
              `${day.opensAt} – ${day.closesAt}`
            ) : (
              <span style={{ color: figma.textMuted }}>Yopiq</span>
            )}
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );
}

/**
 * Direktordagi jadval bilan bir xil ustunlar, faqat amallarsiz:
 * platformada narx qoidasi o'zgartirilmaydi.
 */
function PriceRules({ rules }: { rules: PriceRule[] }) {
  if (rules.length === 0) {
    return <Empty description="Narx qoidasi qo‘yilmagan" />;
  }
  return (
    <Table<PriceRule>
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ x: 'max-content' }}
      dataSource={rules}
      columns={[
        {
          title: 'Nomi',
          dataIndex: 'name',
          render: (value: string | null, row: PriceRule) => (
            <Space>
              {value ?? 'Nomsiz'}
              {row.isBase && <Tag color="blue">Bazaviy</Tag>}
            </Space>
          ),
        },
        {
          title: 'Kunlar',
          dataIndex: 'weekdays',
          render: (value: number[]) =>
            value.length === 0
              ? 'Har kuni'
              : value.map((d) => SHORT.get(d)).join(', '),
        },
        {
          title: 'Vaqt',
          render: (_, row: PriceRule) =>
            row.startsTime && row.endsTime
              ? `${row.startsTime}–${row.endsTime}`
              : 'Butun kun',
        },
        {
          title: 'Soatiga',
          dataIndex: 'pricePerHour',
          render: (value: string) => formatMoney(value),
        },
        {
          title: 'Mavsum',
          render: (_, row: PriceRule) =>
            row.validFrom && row.validTo
              ? `${formatDate(row.validFrom)} – ${formatDate(row.validTo)}`
              : 'Muddatsiz',
        },
        { title: 'Prioritet', dataIndex: 'priority' },
      ]}
    />
  );
}

function Photos({ venue }: { venue: PlatformVenueCard }) {
  if (venue.photos.length === 0) return <Empty description="Foto yo‘q" />;
  return (
    <Space wrap>
      {venue.photos.map((photo) => (
        <Space key={photo.id} direction="vertical" align="center">
          <Image
            src={assetUrl(photo.url)}
            alt={`${venue.name} fotosi`}
            width={160}
            height={110}
            style={{ objectFit: 'cover' }}
          />
          {photo.isPrimary && <Tag color="blue">Asosiy</Tag>}
        </Space>
      ))}
    </Space>
  );
}

function Closures({ closures }: { closures: VenueClosure[] }) {
  if (closures.length === 0) {
    return <Empty description="Yopilish qayd etilmagan" />;
  }
  return (
    <Table<VenueClosure>
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ x: 'max-content' }}
      dataSource={closures}
      columns={[
        {
          title: 'Boshlanishi',
          dataIndex: 'startsAt',
          render: (v: string) => formatDateTime(v),
        },
        {
          title: 'Tugashi',
          dataIndex: 'endsAt',
          render: (v: string) => formatDateTime(v),
        },
        { title: 'Sabab', dataIndex: 'reason' },
      ]}
    />
  );
}

/**
 * Direktor ko'radigan stadion sahifasining platforma ko'rinishi: bir xil
 * karta, bir xil tavsif, bir xil bo'limlar — lekin FAQAT O'QISH uchun.
 *
 * Bronlar, tushum va bandlik ATAYLAB yo'q: TZ 4.2 bo'yicha ish
 * ma'lumoti platformaga yopiq. Buni sahifada ochiq aytamiz — aks holda
 * "nega bo'sh?" degan savol javobsiz qolardi.
 */
export function PlatformVenueDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isPending, error } = usePlatformVenue(id);

  const tab = isTab(searchParams.get('tab'))
    ? (searchParams.get('tab') as Tab)
    : 'prices';

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  const venue = data;
  const bazaviy = venue.basePricePerHour;

  return (
    <div className="flex flex-col gap-6">
      <VenueHero
        venue={venue}
        meta={
          <Link
            to={`/platform/organizations/${venue.organization.id}`}
            style={{ color: figma.primaryBright, fontSize: 13 }}
          >
            {venue.organization.name}
          </Link>
        }
      />

      <Alert
        type="info"
        showIcon
        message="Bronlar va tushum bu yerda ko‘rsatilmaydi"
        description="Platforma tashkilotning tuzilmasini ko‘radi: stadion, ish vaqti, narx va yopilishlar. Bronlar, mijozlar va moliya tashkilotning o‘ziga tegishli."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Ish vaqti">
          <WeeklyHours hours={venue.hours} />
        </Card>

        <Card title="Stadion tavsifi">
          <VenueSpecs venue={venue} basePricePerHour={bazaviy} />
        </Card>
      </div>

      <Card>
        {/* Manzildagi `tab` — havolani yuborish uchun: qo'llab-quvvatlash
            xodimi to'g'ridan-to'g'ri kerakli bo'limga yubora oladi. */}
        <Tabs
          activeKey={tab}
          onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
          items={[
            {
              key: 'prices',
              label: 'Narxlar',
              children: <PriceRules rules={venue.priceRules} />,
            },
            {
              key: 'photos',
              label: 'Fotolar',
              children: <Photos venue={venue} />,
            },
            {
              key: 'closures',
              label: 'Yopilishlar',
              children: <Closures closures={venue.closures} />,
            },
          ]}
        />
      </Card>

      <Typography.Text type="secondary">
        Ma’lumotni tashkilotning o‘z xodimlari o‘zgartiradi.
      </Typography.Text>
    </div>
  );
}
