import { useState } from 'react';
import { Alert, App, Form, Input, Modal, Select } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import {
  PAYMENT_METHOD_OPTIONS,
  type BookingBalance,
  type Payment,
  type PaymentMethod,
} from './api';
import { useAcceptPayment, useRefundPayment } from './hooks';

type PaymentValues = {
  amount: string;
  method: PaymentMethod;
  reason?: string;
};

/**
 * Summa OLDINDAN to'ldiriladi — qolgan qarz bilan. Kassada eng ko'p
 * uchraydigan holat "hammasini to'ladi", ya'ni odam raqamni qayta
 * yozmasligi kerak.
 */
export function AcceptPaymentModal({
  bookingId,
  balance,
  open,
  onClose,
}: {
  bookingId: string;
  balance: BookingBalance;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PaymentValues>();
  const [xato, setXato] = useState<string | null>(null);
  const accept = useAcceptPayment(bookingId);

  return (
    <Modal
      open={open}
      title="To‘lov qabul qilish"
      okText="Qabul qilish"
      cancelText="Bekor qilish"
      confirmLoading={accept.isPending}
      onOk={() => void form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}
      <Alert
        className="!mb-4"
        type="info"
        showIcon
        message={`Qolgan qarz: ${formatMoney(balance.debt)}`}
        description="Qarzdan ko‘p to‘lov qabul qilinmaydi — ortiqcha to‘lov (avans) hozircha yo‘q."
      />
      <Form<PaymentValues>
        form={form}
        layout="vertical"
        initialValues={{ amount: balance.debt, method: 'CASH' }}
        onFinish={(values) =>
          void accept
            .mutateAsync(values)
            .then(() => {
              message.success('To‘lov qabul qilindi');
              onClose();
            })
            .catch((e: unknown) => setXato(errorMessage(e)))
        }
      >
        <Form.Item
          name="amount"
          label="Summa"
          rules={[{ required: true, message: 'Summani kiriting' }]}
        >
          <MoneyInput autoFocus />
        </Form.Item>
        <Form.Item name="method" label="To‘lov usuli">
          {/* Naqd ochiq smenani talab qiladi — server aytadi, biz
              oldindan taxmin qilmaymiz. */}
          <Select options={PAYMENT_METHOD_OPTIONS} />
        </Form.Item>
        <Form.Item name="reason" label="Izoh">
          <Input placeholder="Ixtiyoriy" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type RefundValues = {
  amount: string;
  method: PaymentMethod;
  reason: string;
  reversesPaymentId?: string;
};

export function RefundModal({
  bookingId,
  balance,
  payments,
  open,
  onClose,
}: {
  bookingId: string;
  balance: BookingBalance;
  payments: Payment[];
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<RefundValues>();
  const [xato, setXato] = useState<string | null>(null);
  const refund = useRefundPayment(bookingId);

  const aslTolovlar = payments
    .filter((p) => p.type === 'PAYMENT')
    .map((p) => ({
      value: p.id,
      label: `${formatMoney(p.amount)} — ${p.method === 'CASH' ? 'naqd' : 'karta/o‘tkazma'}`,
    }));

  return (
    <Modal
      open={open}
      title="To‘lovni qaytarish"
      okText="Qaytarish"
      cancelText="Bekor qilish"
      okButtonProps={{ danger: true, loading: refund.isPending }}
      onOk={() => void form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}
      {/* Asl yozuv o'chirilmaydi — buni aytib qo'yish kerak, aks holda
          "to'lovni bekor qildim" deb o'ylanardi. */}
      <Alert
        className="!mb-4"
        type="info"
        showIcon
        message={`To‘langan: ${formatMoney(balance.paid)}`}
        description="Qaytarish alohida yozuv sifatida qo‘shiladi. Asl to‘lov tarixda o‘zgarishsiz qoladi."
      />
      <Form<RefundValues>
        form={form}
        layout="vertical"
        initialValues={{ amount: balance.paid, method: 'CASH' }}
        onFinish={(values) =>
          void refund
            .mutateAsync(values)
            .then(() => {
              message.success('Qaytarildi');
              onClose();
            })
            .catch((e: unknown) => setXato(errorMessage(e)))
        }
      >
        <Form.Item
          name="amount"
          label="Summa"
          rules={[{ required: true, message: 'Summani kiriting' }]}
        >
          <MoneyInput autoFocus />
        </Form.Item>
        <Form.Item name="method" label="Qaytarish usuli">
          <Select options={PAYMENT_METHOD_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="reason"
          label="Sabab"
          rules={[{ required: true, message: 'Sababni yozing' }]}
        >
          <Input placeholder="Masalan: yarim soat kech boshlandi" />
        </Form.Item>
        <Form.Item name="reversesPaymentId" label="Qaysi to‘lov uchun">
          <Select options={aslTolovlar} allowClear placeholder="Ixtiyoriy" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
