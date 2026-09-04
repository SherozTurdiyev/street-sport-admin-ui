import { Alert, Card, Empty, Skeleton, Table, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { figma } from '@/shared/theme/tokens';
import {
  CANCEL_REASON_LABELS,
  type CancelReason,
} from '@/features/bookings/api';
import type { Cancellations, ReportRange } from '../api';
import { useCancellations } from '../hooks';

type ReasonRow = Cancellations['byReason'][number];
type VenueRow = Cancellations['byVenue'][number];
type StaffRow = Cancellations['byStaff'][number];

/**
 * Sabab kodi o'zbekcha nomga. `UNKNOWN` — backend eski yozuvlar uchun
 * qaytaradigan guruh: sabab majburiy bo'lgunicha yaratilgan bronlar.
 */
function sababNomi(reason: string): string {
  if (reason === 'UNKNOWN') return 'Sabab yozilmagan';
  return CANCEL_REASON_LABELS[reason as CancelReason] ?? reason;
}

function Raqam({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 p-4"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
      }}
    >
      <span style={{ color: figma.textMuted, fontSize: 12 }}>{label}</span>
      <Typography.Text strong style={{ fontSize: 22, color: tone }}>
        {value}
      </Typography.Text>
    </div>
  );
}

export function CancellationsTab({ range }: { range: ReportRange }) {
  const { data, isPending, isFetching, error } = useCancellations(range, true);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Raqam label="JAMI BRON" value={String(data.totals.bookings)} />
        <Raqam
          label="BEKOR QILINGAN"
          value={String(data.totals.cancelled)}
          tone={data.totals.cancelled > 0 ? figma.danger : undefined}
        />
        <Raqam label="KELMAGAN" value={String(data.totals.noShow)} />
        <Raqam
          label="BEKOR QILISH ULUSHI"
          value={`${data.totals.cancelRatePercent}%`}
        />
      </div>

      <Card title="Sabablar" styles={{ body: { padding: 0 } }}>
        <Table<ReasonRow>
          rowKey="reason"
          dataSource={data.byReason}
          loading={isFetching}
          pagination={false}
          scroll={{ x: true }}
          locale={{
            emptyText: <Empty description="Bu davrda bekor qilish yo‘q" />,
          }}
          columns={[
            {
              title: 'Sabab',
              dataIndex: 'reason',
              render: (reason: string) => sababNomi(reason),
            },
            { title: 'Soni', dataIndex: 'count', align: 'right' },
          ]}
        />
      </Card>

      <Card title="Stadionlar" styles={{ body: { padding: 0 } }}>
        <Table<VenueRow>
          rowKey="venueId"
          dataSource={data.byVenue}
          pagination={false}
          scroll={{ x: true }}
          locale={{ emptyText: <Empty description="Stadion yo‘q" /> }}
          columns={[
            { title: 'Stadion', dataIndex: 'venueName' },
            { title: 'Bekor qilingan', dataIndex: 'cancelled', align: 'right' },
            { title: 'Kelmagan', dataIndex: 'noShow', align: 'right' },
          ]}
        />
      </Card>

      <Card title="Xodimlar" styles={{ body: { padding: 0 } }}>
        <Table<StaffRow>
          rowKey="userId"
          dataSource={data.byStaff}
          pagination={false}
          scroll={{ x: true }}
          locale={{
            emptyText: (
              <Empty description="Bu davrda hech kim bekor qilmagan" />
            ),
          }}
          columns={[
            { title: 'Xodim', dataIndex: 'userName' },
            { title: 'Bekor qilgan', dataIndex: 'cancelled', align: 'right' },
          ]}
        />
        {/* Bu chegara backenddan keladi va uni yashirish yanada
            chalg'ituvchi bo'lardi: jadval to'liq ko'rinardi-yu, aslida
            yarim ma'lumot bo'lardi. */}
        <div
          className="px-4 py-3"
          style={{ color: figma.textMuted, fontSize: 12 }}
        >
          Xodim kesimi bekor qilingan VAQT bo‘yicha hisoblanadi. Kelmagan
          holatini kim belgilaganini tizim saqlamaydi, shuning uchun u bu
          jadvalda yo‘q.
        </div>
      </Card>
    </div>
  );
}
