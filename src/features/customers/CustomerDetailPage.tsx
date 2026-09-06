import { useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Popconfirm,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDateTime, formatTime } from '@/shared/format/time';
import { displayPhone } from '@/shared/format/phone';
import { figma } from '@/shared/theme/tokens';
import { useCan } from '@/features/auth/hooks';
import { StatCard } from '@/features/dashboard/StatCard';
import { BOOKING_STATUS_VIEW, type Booking } from '@/features/bookings/api';
import { useVenueOptions } from '@/features/venues/hooks';
import type { CustomerCard } from './api';
import { CustomerFormModal } from './CustomerFormModal';
import { useCustomer, useSetBlacklist } from './hooks';

function Hero({ customer }: { customer: CustomerCard }) {
  const { message } = App.useApp();
  const can = useCan();
  const [formOpen, setFormOpen] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const blacklist = useSetBlacklist(customer.id);

  async function almashtir(): Promise<void> {
    setXato(null);
    try {
      await blacklist.mutateAsync(!customer.isBlacklisted);
      message.success(
        customer.isBlacklisted
          ? 'Qora ro‘yxatdan chiqarildi'
          : 'Qora ro‘yxatga qo‘shildi',
      );
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-6 p-6"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <Typography.Title
            level={1}
            style={{ fontSize: 'clamp(20px, 5vw, 28px)', margin: 0 }}
          >
            {customer.fullName}
          </Typography.Title>
          {customer.isBlacklisted && <Tag color="error">Qora ro‘yxat</Tag>}
          {customer.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        <div className="mt-2" style={{ color: figma.textMuted, fontSize: 13 }}>
          {displayPhone(customer.phone)}
          {customer.note !== null && ` · ${customer.note}`}
        </div>

        {xato !== null && (
          <Alert className="mt-3" type="error" showIcon message={xato} />
        )}
      </div>

      <Space>
        {can('customer.manage') && (
          <Button onClick={() => setFormOpen(true)}>Tahrirlash</Button>
        )}
        {/* Qora ro'yxat bron yaratishni TAQIQLAMAYDI — u ogohlantirish.
            Shuning uchun tugma "bloklash" emas, belgini almashtiradi. */}
        {can('customer.blacklist') && (
          <Popconfirm
            title={
              customer.isBlacklisted
                ? 'Qora ro‘yxatdan chiqarilsinmi?'
                : 'Qora ro‘yxatga qo‘shilsinmi?'
            }
            description="Bron yaratish taqiqlanmaydi — operator ogohlantirish oladi."
            okText="Ha"
            cancelText="Yo‘q"
            onConfirm={() => void almashtir()}
          >
            <Button danger={!customer.isBlacklisted}>
              {customer.isBlacklisted
                ? 'Qora ro‘yxatdan chiqarish'
                : 'Qora ro‘yxatga qo‘shish'}
            </Button>
          </Popconfirm>
        )}
      </Space>

      <CustomerFormModal
        open={formOpen}
        customer={customer}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}

function History({ bookings }: { bookings: Booking[] }) {
  const venues = useVenueOptions(true);
  const nomlar = new Map((venues.data ?? []).map((v) => [v.id, v.name]));

  return (
    <Table<Booking>
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={bookings}
      scroll={{ x: 'max-content' }}
      columns={[
        {
          title: 'Vaqt',
          dataIndex: 'startsAt',
          render: (_, row) =>
            `${formatDateTime(row.startsAt)} – ${formatTime(row.endsAt)}`,
        },
        {
          title: 'Stadion',
          responsive: ['md'],
          dataIndex: 'venueId',
          render: (value: string) => nomlar.get(value) ?? '—',
        },
        {
          title: 'Narx',
          dataIndex: 'priceTotal',
          render: (value: string) => formatMoney(value),
        },
        {
          title: 'Holat',
          dataIndex: 'status',
          render: (value: Booking['status']) => (
            <Tag color={BOOKING_STATUS_VIEW[value].color}>
              {BOOKING_STATUS_VIEW[value].label}
            </Tag>
          ),
        },
      ]}
    />
  );
}

export function CustomerDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isPending, error } = useCustomer(id);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Hero customer={data} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4 sm:gap-6">
        <StatCard
          label="Jami bronlar"
          icon={CalendarOutlined}
          tint={figma.primaryBright}
          value={data.stats.totalBookings}
        />
        <StatCard
          label="Yakunlangan"
          icon={CheckCircleOutlined}
          tint={figma.success}
          value={data.stats.completedCount}
        />
        <StatCard
          label="Bekor qilingan"
          icon={CloseCircleOutlined}
          tint={figma.warning}
          value={data.stats.cancelledCount}
          hint={`Kelmagan: ${data.stats.noShowCount}`}
        />
        <StatCard
          label="Jami to‘lagan"
          icon={DollarOutlined}
          tint={figma.success}
          value={formatMoney(data.stats.totalPaid)}
        />
        <StatCard
          label="Joriy qarz"
          icon={WalletOutlined}
          // Qarzi bor mijoz ko'zga tashlanishi kerak, nol esa yo'q.
          tint={data.stats.currentDebt === '0' ? figma.textMuted : figma.danger}
          value={formatMoney(data.stats.currentDebt)}
          hint="Bekor qilingan bronlar hisobga olinmaydi."
        />
        <StatCard
          label="Oxirgi tashrif"
          icon={ClockCircleOutlined}
          tint={figma.textMuted}
          value={
            data.stats.lastVisitAt === null
              ? '—'
              : formatDateTime(data.stats.lastVisitAt)
          }
        />
      </div>

      <Card title="Bronlar tarixi">
        <History bookings={data.bookings} />
      </Card>
    </div>
  );
}
