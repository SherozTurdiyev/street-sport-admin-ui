import { useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDate, formatDateTime, formatTime } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { useCan } from '@/features/auth/hooks';
import { StatCard } from '@/features/dashboard/StatCard';
import {
  BOOKING_STATUS_VIEW,
  CANCEL_REASON_LABELS,
  type Booking,
  type CancelReason,
} from '@/features/bookings/api';
import { WEEKDAYS } from '@/features/venues/enums';
import type { SeriesCard } from './api';
import { useCancelSeries, useExtendSeries, useSeries } from './hooks';

const SHORT = new Map(WEEKDAYS.map((d) => [d.value, d.short]));

const REASON_OPTIONS = Object.entries(CANCEL_REASON_LABELS).map(
  ([value, label]) => ({ value, label }),
);

function ExtendModal({
  id,
  open,
  onClose,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{
    weeks: number;
    onConflict: 'SKIP' | 'ABORT';
  }>();
  const [xato, setXato] = useState<string | null>(null);
  const extend = useExtendSeries(id);

  return (
    <Modal
      open={open}
      title="Seriyani uzaytirish"
      okText="Uzaytirish"
      cancelText="Yopish"
      confirmLoading={extend.isPending}
      onOk={() => void form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}
      <Typography.Paragraph type="secondary">
        Uzaytirish muddati cheklanmaydi. Uzun muddat ko‘p bron yaratadi — band
        sanalar bilan nima qilishni quyida tanlang.
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ weeks: 2, onConflict: 'SKIP' }}
        onFinish={(values) =>
          void extend
            .mutateAsync(values)
            .then((r) => {
              message.success(`${r.createdCount} ta bron qo‘shildi`);
              onClose();
            })
            .catch((e: unknown) => setXato(errorMessage(e)))
        }
      >
        {/*
          Ilgari bu 12 variantli `Select` edi — chegara bilan birga
          o'sha ro'yxat ham ma'nosiz bo'lib qoldi. Backend yagona
          shartni qo'yadi: `weeks >= 1`.
        */}
        <Form.Item name="weeks" label="Necha hafta">
          <InputNumber className="w-full" min={1} precision={0} />
        </Form.Item>
        <Form.Item name="onConflict" label="Band sana bo‘lsa">
          <Select
            options={[
              { value: 'SKIP', label: 'O‘tkazib yuborilsin' },
              { value: 'ABORT', label: 'Hech narsa yaratilmasin' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function CancelModal({
  id,
  open,
  onClose,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ reason: CancelReason }>();
  const [xato, setXato] = useState<string | null>(null);
  const cancel = useCancelSeries(id);

  return (
    <Modal
      open={open}
      title="Butun seriyani bekor qilish"
      okText="Bekor qilish"
      cancelText="Yopish"
      okButtonProps={{ danger: true, loading: cancel.isPending }}
      onOk={() => void form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}
      {/* O'tib ketgan o'yinlar tarixda qoladi — buni aytib qo'yish
          kerak, aks holda "hammasi o'chib ketdi" deb o'ylanardi. */}
      <Typography.Paragraph type="secondary">
        Faqat kelajakdagi bronlar bekor qilinadi. O‘tib ketgan o‘yinlar tarixda
        o‘zgarishsiz qoladi.
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>
          void cancel
            .mutateAsync(values)
            .then((r) => {
              message.success(`${r.cancelledCount} ta bron bekor qilindi`);
              onClose();
            })
            .catch((e: unknown) => setXato(errorMessage(e)))
        }
      >
        <Form.Item
          name="reason"
          label="Sabab"
          rules={[{ required: true, message: 'Sababni tanlang' }]}
        >
          <Select options={REASON_OPTIONS} placeholder="Tanlang" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function Hero({ series }: { series: SeriesCard }) {
  const can = useCan();
  const [extend, setExtend] = useState(false);
  const [cancel, setCancel] = useState(false);

  const kunlar =
    series.weekdays.length === 0
      ? 'Har kuni'
      : series.weekdays.map((d) => SHORT.get(d)).join(', ');

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
        <Typography.Title
          level={1}
          style={{ fontSize: 'clamp(19px, 5vw, 26px)', margin: 0 }}
        >
          <Link to={`/customers/${series.customer.id}`}>
            {series.customer.fullName}
          </Link>
        </Typography.Title>
        <div className="mt-2" style={{ color: figma.textMuted, fontSize: 13 }}>
          {`${series.venue.name} · ${kunlar} · ${series.startTime} · ${series.durationMinutes / 60} soat`}
        </div>
        <div className="mt-1" style={{ color: figma.textMuted, fontSize: 13 }}>
          {`${formatDate(series.startDate)} – ${formatDate(series.endDate)} · ${formatMoney(series.pricePerHour)}/soat`}
        </div>
      </div>

      <Space>
        {can('booking.series.create') && (
          <Button onClick={() => setExtend(true)}>Uzaytirish</Button>
        )}
        {/* Butun seriyani bekor qilish administratorga yopiq (BR-04
            uslubida): bu bir necha o'nlab bronga tegadigan amal. */}
        {can('booking.series.cancel') && (
          <Button danger onClick={() => setCancel(true)}>
            Butun seriyani bekor qilish
          </Button>
        )}
      </Space>

      <ExtendModal
        id={series.id}
        open={extend}
        onClose={() => setExtend(false)}
      />
      <CancelModal
        id={series.id}
        open={cancel}
        onClose={() => setCancel(false)}
      />
    </div>
  );
}

export function SeriesDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isPending, error } = useSeries(id);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Hero series={data} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4 sm:gap-6">
        <StatCard
          label="Jami uchrashuv"
          icon={CalendarOutlined}
          tint={figma.primaryBright}
          value={data.stats.totalCount}
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
          label="Oldinda"
          icon={FieldTimeOutlined}
          tint={figma.textMuted}
          value={data.stats.upcomingCount}
        />
      </div>

      <Card title="Uchrashuvlar">
        <Table<Booking>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={data.bookings}
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Vaqt',
              dataIndex: 'startsAt',
              render: (_, row) =>
                `${formatDateTime(row.startsAt)} – ${formatTime(row.endsAt)}`,
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
            {
              title: '',
              render: (_, row) => (
                <Link to={`/bookings?booking=${row.id}`}>Ochish</Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
