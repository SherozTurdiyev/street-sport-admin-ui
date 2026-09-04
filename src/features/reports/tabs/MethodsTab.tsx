import { Alert, Skeleton, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { figma } from '@/shared/theme/tokens';
import { PAYMENT_METHOD_LABELS } from '@/features/payments/api';
import type { ReportRange } from '../api';
import { useRevenueByMethod } from '../hooks';
import { ShareBar } from '../ShareBar';

/**
 * TZ M10: "Naqd ulushi yuqori bo'lsa, bu nazorat zarurligini
 * bildiradi." Chegara shu yerda ochiq yozilgan — sonni kodda
 * yashirmaslik kerak, chunki uni keyin muhokama qilishadi.
 */
const NAQD_OGOHLANTIRISH = 70;

export function MethodsTab({ range }: { range: ReportRange }) {
  const { data, isPending, error } = useRevenueByMethod(range, true);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  const naqd = data.items.find((i) => i.method === 'CASH');
  const naqdKop = naqd !== undefined && naqd.sharePercent >= NAQD_OGOHLANTIRISH;

  return (
    <div className="flex flex-col gap-4">
      <Typography.Text style={{ color: figma.textMuted }}>
        Jami tushum:{' '}
        <Typography.Text strong style={{ fontSize: 18 }}>
          {formatMoney(data.total)}
        </Typography.Text>
      </Typography.Text>

      {naqdKop && (
        <Alert
          type="warning"
          showIcon
          message={`Naqd ulushi ${naqd.sharePercent}%`}
          description="Naqd pul kassa nazoratini talab qiladi: smenalarni har kuni yopib boring va farqlarni kuzating."
        />
      )}

      <div className="flex flex-col gap-3">
        {data.items.map((row) => {
          const naqdQator = row.method === 'CASH';
          return (
            <div key={row.method} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span>{PAYMENT_METHOD_LABELS[row.method]}</span>
                <Typography.Text strong>
                  {formatMoney(row.amount)}
                </Typography.Text>
              </div>
              <ShareBar
                percent={row.sharePercent}
                tone={
                  row.sharePercent === 0
                    ? 'muted'
                    : naqdQator && naqdKop
                      ? 'warning'
                      : 'normal'
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
