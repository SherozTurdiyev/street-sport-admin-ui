import { Alert, Empty, Skeleton, Table, Typography } from 'antd';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { figma } from '@/shared/theme/tokens';
import type { ReportRange, VenueRevenue } from '../api';
import { useRevenueByVenue } from '../hooks';
import { ShareBar } from '../ShareBar';

/**
 * F10.2 — stadion kesimida daromad.
 *
 * Tushumsiz stadion ham qatorda qoladi: "bu obyekt pul keltirmayapti"
 * degan javob ham javob va uni ro'yxatdan yashirib bo'lmaydi.
 */
export function VenuesTab({ range }: { range: ReportRange }) {
  const { data, isPending, isFetching, error } = useRevenueByVenue(range, true);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <div className="flex flex-col gap-3">
      <Typography.Text style={{ color: figma.textMuted }}>
        Jami tushum:{' '}
        <Typography.Text strong style={{ fontSize: 18 }}>
          {formatMoney(data.total)}
        </Typography.Text>
      </Typography.Text>

      <Table<VenueRevenue>
        rowKey="venueId"
        dataSource={data.items}
        loading={isFetching}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: <Empty description="Bu davrda tushum bo‘lmagan" />,
        }}
        columns={[
          {
            title: 'Stadion',
            dataIndex: 'venueName',
            render: (name: string, row) => (
              <Link to={`/venues/${row.venueId}`}>{name}</Link>
            ),
          },
          {
            title: 'Tushum',
            dataIndex: 'revenue',
            align: 'right',
            render: (value: string) => (
              <Typography.Text strong>{formatMoney(value)}</Typography.Text>
            ),
          },
          {
            title: 'Ulush',
            responsive: ['sm'],
            dataIndex: 'sharePercent',
            width: 200,
            render: (percent: number) => (
              <ShareBar
                percent={percent}
                tone={percent === 0 ? 'muted' : 'normal'}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
