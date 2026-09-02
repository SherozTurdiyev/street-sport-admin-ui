import { useState } from 'react';
import { Alert, App, Form, Input, Modal, Select, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import {
  CANCEL_REASON_LABELS,
  type BookingCard,
  type CancelReason,
} from './api';
import { useCancelBooking } from './hooks';

type Values = { reason: CancelReason; comment?: string };

const OPTIONS = Object.entries(CANCEL_REASON_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Sabab MAJBURIY (BR-07): u statistikaga kiradi va "nega bekor
 * qilindi?" degan savol javobsiz qolmasligi kerak.
 */
export function CancelBookingModal({
  booking,
  open,
  onClose,
}: {
  booking: BookingCard;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [xato, setXato] = useState<string | null>(null);
  const cancel = useCancelBooking(booking.id);

  async function onFinish(values: Values): Promise<void> {
    setXato(null);
    try {
      await cancel.mutateAsync({
        reason: values.reason,
        comment: values.comment?.trim() || undefined,
      });
      message.success('Bron bekor qilindi');
      onClose();
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  return (
    <Modal
      open={open}
      title="Bronni bekor qilish"
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

      <Typography.Paragraph type="secondary">
        Bekor qilingan bron tarixda qoladi, lekin vaqt bo‘shaydi — o‘sha soatga
        yangi bron ochish mumkin bo‘ladi.
      </Typography.Paragraph>

      <Form<Values> form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="reason"
          label="Sabab"
          rules={[{ required: true, message: 'Sababni tanlang' }]}
        >
          <Select options={OPTIONS} placeholder="Tanlang" />
        </Form.Item>
        <Form.Item name="comment" label="Izoh">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
