import { useState } from 'react';
import { Alert, App, Form, Input, Modal, Select } from 'antd';
import { applyServerErrors, errorMessage } from '@/shared/api/error-handler';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import type { Customer } from './api';
import { useCreateCustomer, useUpdateCustomer } from './hooks';

type Values = {
  phone: string;
  fullName: string;
  note?: string;
  tags?: string[];
};

const FIELDS = ['phone', 'fullName', 'note', 'tags'] as const;

/**
 * Bitta oyna ikki ish uchun: yangi mijoz va tahrirlash. Farqi bitta —
 * TELEFON tahrirda o'zgarmaydi. U mijozning identifikatori va bronlar
 * bilan bog'langan, backend ham uni `PATCH` da qabul qilmaydi.
 */
export function CustomerFormModal({
  open,
  customer,
  onClose,
}: {
  open: boolean;
  customer?: Customer | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [xato, setXato] = useState<string | null>(null);
  const create = useCreateCustomer();
  const update = useUpdateCustomer(customer?.id ?? '');
  const busy = create.isPending || update.isPending;

  async function onFinish(values: Values): Promise<void> {
    setXato(null);
    try {
      if (customer) {
        await update.mutateAsync({
          fullName: values.fullName.trim(),
          note: values.note?.trim() || null,
          tags: values.tags ?? [],
        });
        message.success('Saqlandi');
      } else {
        await create.mutateAsync({
          phone: values.phone.trim(),
          fullName: values.fullName.trim(),
        });
        message.success('Mijoz qo‘shildi');
      }
      onClose();
    } catch (e) {
      if (!applyServerErrors(form, e, FIELDS)) setXato(errorMessage(e));
    }
  }

  return (
    <Modal
      open={open}
      title={customer ? 'Mijozni tahrirlash' : 'Yangi mijoz'}
      okText="Saqlash"
      cancelText="Bekor qilish"
      confirmLoading={busy}
      onOk={() => void form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}

      <Form<Values>
        form={form}
        layout="vertical"
        key={customer?.id ?? 'yangi'}
        initialValues={{
          phone: customer?.phone ?? '',
          fullName: customer?.fullName ?? '',
          note: customer?.note ?? undefined,
          tags: customer?.tags ?? [],
        }}
        onFinish={onFinish}
      >
        <Form.Item
          name="phone"
          label="Telefon"
          extra={
            customer ? 'Telefon o‘zgarmaydi — u mijozning raqami' : undefined
          }
          rules={[
            { required: true, message: 'Telefon raqamini kiriting' },
            {
              pattern: /^\+998\d{9}$/,
              message: 'Raqamni to‘liq kiriting: +998 (90) 000-00-00',
            },
          ]}
        >
          <PhoneInput disabled={Boolean(customer)} />
        </Form.Item>

        <Form.Item
          name="fullName"
          label="Ism va familiya"
          rules={[{ required: true, message: 'Ismni kiriting' }]}
        >
          <Input />
        </Form.Item>

        {customer && (
          <>
            <Form.Item name="note" label="Izoh">
              <Input />
            </Form.Item>
            <Form.Item
              name="tags"
              label="Teglar"
              extra="Masalan: VIP, NAQD. Enter bilan qo‘shiladi"
            >
              <Select mode="tags" open={false} suffixIcon={null} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
