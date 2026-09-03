import { useState } from 'react';
import { Alert, Button, Empty, Skeleton, Space, Tag, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDateTime } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { useCan } from '@/features/auth/hooks';
import { PAYMENT_METHOD_LABELS, type Payment } from './api';
import { usePayments } from './hooks';
import { AcceptPaymentModal, RefundModal } from './PaymentModals';

function Row({ payment }: { payment: Payment }) {
  const qaytarish = payment.type === 'REFUND';
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 py-2"
      style={{ borderTop: `1px solid ${figma.border}` }}
    >
      <div className="min-w-0">
        <Typography.Text
          strong
          style={{ color: qaytarish ? figma.danger : undefined }}
        >
          {qaytarish ? '−' : '+'}
          {formatMoney(payment.amount)}
        </Typography.Text>
        <div style={{ color: figma.textMuted, fontSize: 12 }}>
          {formatDateTime(payment.paidAt)}
          {payment.receiverName === null ? '' : ` · ${payment.receiverName}`}
          {payment.reason === null ? '' : ` · ${payment.reason}`}
        </div>
      </div>
      <Tag color={qaytarish ? 'error' : 'success'}>
        {PAYMENT_METHOD_LABELS[payment.method]}
      </Tag>
    </div>
  );
}

/**
 * Bron kartochkasidagi pul bo'limi: balans, tarix va ikkita amal.
 *
 * Tugmalar ruxsatga qarab chiziladi — administratorda `payment.refund`
 * yo'q va unga ishlamaydigan tugma ko'rsatishning ma'nosi yo'q.
 */
export function PaymentsPanel({
  bookingId,
  cancelled,
}: {
  bookingId: string;
  /** Bekor qilingan bronga to'lov qabul qilinmaydi, qaytarish mumkin. */
  cancelled: boolean;
}) {
  const can = useCan();
  const { data, isPending, error } = usePayments(bookingId);
  const [qabul, setQabul] = useState(false);
  const [qaytar, setQaytar] = useState(false);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  const { balance, items } = data;
  const qarzBor = balance.debt !== '0';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <span>
          <span style={{ color: figma.textMuted, fontSize: 12 }}>
            To‘langan{' '}
          </span>
          <Typography.Text strong>{formatMoney(balance.paid)}</Typography.Text>
        </span>
        <span>
          <span style={{ color: figma.textMuted, fontSize: 12 }}>Qarz </span>
          <Typography.Text
            strong
            style={{ color: qarzBor ? figma.danger : figma.success }}
          >
            {formatMoney(balance.debt)}
          </Typography.Text>
        </span>
        {balance.refunded !== '0' && (
          <span>
            <span style={{ color: figma.textMuted, fontSize: 12 }}>
              Qaytarilgan{' '}
            </span>
            <Typography.Text strong>
              {formatMoney(balance.refunded)}
            </Typography.Text>
          </span>
        )}
      </div>

      <Space wrap>
        {can('payment.accept') && qarzBor && !cancelled && (
          <Button type="primary" onClick={() => setQabul(true)}>
            To‘lov qabul qilish
          </Button>
        )}
        {can('payment.refund') && balance.paid !== '0' && (
          <Button danger onClick={() => setQaytar(true)}>
            Qaytarish
          </Button>
        )}
      </Space>

      {items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Hali to‘lov yo‘q"
        />
      ) : (
        <div className="flex flex-col">
          {items.map((payment) => (
            <Row key={payment.id} payment={payment} />
          ))}
        </div>
      )}

      <AcceptPaymentModal
        bookingId={bookingId}
        balance={balance}
        open={qabul}
        onClose={() => setQabul(false)}
      />
      <RefundModal
        bookingId={bookingId}
        balance={balance}
        payments={items}
        open={qaytar}
        onClose={() => setQaytar(false)}
      />
    </div>
  );
}
