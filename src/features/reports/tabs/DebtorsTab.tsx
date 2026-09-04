import { useState } from 'react';
import { Alert, Empty, Skeleton, Table, Typography } from 'antd';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { DEFAULT_PAGE_SIZE } from '@/shared/api/types';
import { formatMoney } from '@/shared/format/money';
import { displayPhone } from '@/shared/format/phone';
import { figma } from '@/shared/theme/tokens';
import type { Debtor } from '../api';
import { useDebtors } from '../hooks';

/** 30 kundan oshgan qarz — qizil: uni undirish alohida ish. */
const ESKI_QARZ_KUNI = 30;

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
      <Typography.Text strong style={{ fontSize: 20, color: tone }}>
        {value}
      </Typography.Text>
    </div>
  );
}

/**
 * F10.6 — qarzdorlar. Sana oralig'i YO'Q: qarz joriy holat, uni
 * "o'tgan oy bo'yicha" so'rashning ma'nosi yo'q.
 *
 * `venueIds` esa qo'llanadi — administrator faqat o'z stadionlarining
 * qarzdorlarini ko'radi (buni backend BR-08 bilan ta'minlaydi).
 */
export function DebtorsTab({ venueIds }: { venueIds?: string[] }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isFetching, error } = useDebtors(
    { venueIds, page, pageSize: DEFAULT_PAGE_SIZE },
    true,
  );

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  const bor = data.totals.total !== '0';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Raqam
          label="JAMI QARZ"
          value={formatMoney(data.totals.total)}
          tone={bor ? figma.danger : figma.success}
        />
        <Raqam label="7 KUNGACHA" value={formatMoney(data.totals.upTo7Days)} />
        <Raqam
          label="7–30 KUN"
          value={formatMoney(data.totals.from7To30Days)}
        />
        <Raqam
          label="30 KUNDAN ORTIQ"
          value={formatMoney(data.totals.over30Days)}
          tone={data.totals.over30Days === '0' ? undefined : figma.danger}
        />
      </div>

      <Table<Debtor>
        rowKey={(row) => row.customerId ?? 'anonim'}
        dataSource={data.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="Qarzdor yo‘q" /> }}
        pagination={{
          current: data.page,
          pageSize: data.pageSize,
          total: data.total,
          showSizeChanger: false,
          onChange: setPage,
        }}
        columns={[
          {
            title: 'Mijoz',
            dataIndex: 'customerName',
            render: (name: string | null, row) =>
              // Anonim bronda bosadigan joy yo'q: mijoz kartochkasi ham,
              // telefon raqami ham mavjud emas.
              row.customerId === null ? (
                <span style={{ color: figma.textMuted }}>Anonim bron</span>
              ) : (
                <Link to={`/customers/${row.customerId}`}>
                  {name ?? 'Nomsiz'}
                </Link>
              ),
          },
          {
            title: 'Telefon',
            dataIndex: 'phone',
            render: (phone: string | null) => displayPhone(phone),
          },
          {
            title: 'Qarz',
            dataIndex: 'debt',
            align: 'right',
            render: (value: string) => (
              <Typography.Text strong style={{ color: figma.danger }}>
                {formatMoney(value)}
              </Typography.Text>
            ),
          },
          { title: 'Bronlar', dataIndex: 'bookingCount', align: 'right' },
          {
            title: 'Eng eski qarz',
            dataIndex: 'oldestDebtDays',
            align: 'right',
            render: (days: number) => (
              <span
                style={{
                  color: days > ESKI_QARZ_KUNI ? figma.danger : undefined,
                }}
              >
                {days} kun
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
