import { Alert, Empty, Skeleton, Table, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { figma } from '@/shared/theme/tokens';
import type { ReportRange, StaffRow } from '../api';
import { useStaffReport } from '../hooks';

/** Kassa farqi: manfiy — pul yetishmagan, nol — hammasi joyida. */
function Farq({ value }: { value: string }) {
  const nol = value === '0';
  const kam = value.startsWith('-');
  return (
    <Typography.Text
      strong
      style={{ color: nol ? undefined : kam ? figma.danger : figma.warning }}
    >
      {nol ? formatMoney('0') : `${kam ? '' : '+'}${formatMoney(value)}`}
    </Typography.Text>
  );
}

/**
 * F10.7 — xodimlar kesimi.
 *
 * "Qabul qilgan" va "qaytargan" ALOHIDA ustunlarda: bir-biridan
 * ayirilsa, kassir qancha pul o'tkazgani ko'rinmay qolardi.
 */
export function StaffTab({ range }: { range: ReportRange }) {
  const { data, isPending, isFetching, error } = useStaffReport(range, true);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <Table<StaffRow>
      rowKey="userId"
      dataSource={data.items}
      loading={isFetching}
      pagination={false}
      scroll={{ x: true }}
      locale={{
        emptyText: <Empty description="Bu davrda xodim amali bo‘lmagan" />,
      }}
      columns={[
        { title: 'Xodim', dataIndex: 'userName', fixed: 'left' },
        { title: 'Yaratgan', dataIndex: 'bookingsCreated', align: 'right' },
        {
          title: 'Bekor qilgan',
          dataIndex: 'bookingsCancelled',
          align: 'right',
        },
        {
          title: 'Qabul qilgan',
          dataIndex: 'paymentsReceived',
          align: 'right',
          render: (value: string) => formatMoney(value),
        },
        {
          title: 'Qaytargan',
          dataIndex: 'refundsIssued',
          align: 'right',
          render: (value: string) => formatMoney(value),
        },
        { title: 'Smena', dataIndex: 'shiftsClosed', align: 'right' },
        {
          title: 'Kassa farqi',
          dataIndex: 'cashDifference',
          align: 'right',
          render: (value: string) => <Farq value={value} />,
        },
      ]}
    />
  );
}
