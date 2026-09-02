import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Popconfirm,
  Skeleton,
  Space,
  Table,
  Tag,
} from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDate } from '@/shared/format/time';
import { WEEKDAYS } from '../enums';
import type { PriceRule } from './api';
import { PriceCalculator } from './PriceCalculator';
import { PriceRuleModal } from './PriceRuleModal';
import { PriceTable } from './PriceTable';
import { useDeletePriceRule, usePriceRules } from './hooks';

const SHORT = new Map(WEEKDAYS.map((d) => [d.value, d.short]));

export function PriceRulesTab({ venueId }: { venueId: string }) {
  const { message } = App.useApp();
  const { data, isPending, error } = usePriceRules(venueId);
  const remove = useDeletePriceRule(venueId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PriceRule | null>(null);
  const [xato, setXato] = useState<string | null>(null);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  const bazaviyBor = data.some((rule) => rule.isBase);

  function ochish(rule: PriceRule | null): void {
    setEditing(rule);
    setModalOpen(true);
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      {xato !== null && <Alert type="error" showIcon message={xato} />}

      {/* Bazaviy qoidasiz bron UMUMAN yaratilmaydi
          (`PRICE_BASE_RULE_MISSING`). Buni bron yaratishga urinilganda
          emas, hozir aytish kerak. */}
      {!bazaviyBor && (
        <Alert
          type="warning"
          showIcon
          message="Bazaviy qoida yo‘q"
          description="Bazaviy qoidasiz bu stadionga bron yaratib bo‘lmaydi. Hech qanday shart qo‘ymaydigan bitta qoida qo‘shing."
        />
      )}

      <div className="flex justify-end">
        <Button type="primary" onClick={() => ochish(null)}>
          Yangi qoida
        </Button>
      </div>

      <Table<PriceRule>
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={data}
        columns={[
          {
            title: 'Nomi',
            dataIndex: 'name',
            render: (value: string | null, row: PriceRule) => (
              <Space>
                <Button
                  type="link"
                  className="!px-0"
                  onClick={() => ochish(row)}
                >
                  {value ?? 'Nomsiz'}
                </Button>
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
          {
            title: '',
            // Tahrirlash amallar ustunida TURISHI SHART: nomni bosish
            // ham ochadi, lekin uni ko'rinmas amal deb o'ylash oson —
            // qatorga qaragan odam faqat "O'chirish" ni ko'rardi.
            render: (_, row: PriceRule) => (
              <Space size={0}>
                <Button type="text" size="small" onClick={() => ochish(row)}>
                  Tahrirlash
                </Button>
                <Popconfirm
                  title="Qoida o‘chirilsinmi?"
                  okText="Ha"
                  cancelText="Yo‘q"
                  onConfirm={() =>
                    void remove
                      .mutateAsync(row.id)
                      .then(() => message.success('Qoida o‘chirildi'))
                      .catch((e: unknown) => setXato(errorMessage(e)))
                  }
                >
                  <Button type="text" danger size="small">
                    O‘chirish
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <PriceTable venueId={venueId} />
      <PriceCalculator venueId={venueId} />

      <PriceRuleModal
        venueId={venueId}
        open={modalOpen}
        rule={editing}
        onClose={() => setModalOpen(false)}
      />
    </Space>
  );
}
