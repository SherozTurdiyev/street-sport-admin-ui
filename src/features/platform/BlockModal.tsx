import { useState } from 'react';
import { Alert, Form, Input, Modal, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';

type Values = { reason: string };

/**
 * Sabab MAJBURIY (3–300 belgi) — backend ham shuni talab qiladi.
 * Bloklash tashkilotning ishini to'xtatadi va oradan bir oy o'tib
 * "nega bloklangan?" degan savolga javob topilishi kerak.
 */
export function BlockModal({
  open,
  busy,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [form] = Form.useForm<Values>();
  const [xato, setXato] = useState<string | null>(null);

  async function onFinish(values: Values): Promise<void> {
    setXato(null);
    try {
      await onSubmit(values.reason.trim());
      form.resetFields();
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  return (
    <Modal
      open={open}
      title="Bloklash"
      okText="Bloklash"
      cancelText="Bekor qilish"
      okButtonProps={{ danger: true }}
      confirmLoading={busy}
      onCancel={onCancel}
      onOk={() => void form.submit()}
      destroyOnHidden
    >
      {xato === null ? null : (
        <Alert type="error" showIcon message={xato} className="!mb-4" />
      )}

      <Typography.Paragraph type="secondary">
        Bloklangan tashkilotda ma'lumot ko'rish ochiq qoladi, yozish esa
        to'xtaydi. Hech narsa o'chirilmaydi.
      </Typography.Paragraph>

      <Form<Values> form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="reason"
          label="Sabab"
          rules={[
            { required: true, message: 'Bloklash sababini yozing' },
            { min: 3, message: "Kamida 3 belgi bo'lishi kerak" },
            { max: 300, message: "Ko'pi bilan 300 belgi" },
          ]}
        >
          <Input.TextArea rows={3} placeholder="To'lov muddati o'tib ketdi" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
