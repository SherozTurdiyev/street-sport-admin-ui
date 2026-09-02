import { useState } from 'react';
import { Alert, App, Button, DatePicker, Form, Input } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import type { PlatformOrganizationDetail } from '../api';
import { useUpdateOrganization } from '../hooks';

type Values = {
  name: string;
  phone?: string;
  address?: string;
  subscriptionEndsAt?: Dayjs | null;
};

/**
 * `subscriptionStatus` bu yerda YO'Q va bo'lmasligi kerak: holat faqat
 * bloklash va blokdan chiqarish orqali o'zgaradi, backend uni formadan
 * qabul qilmaydi (400). Aks holda sababsiz bloklangan tashkilotlar
 * paydo bo'lardi.
 */
export function OrgProfileForm({ org }: { org: PlatformOrganizationDetail }) {
  const { message } = App.useApp();
  const update = useUpdateOrganization(org.id);
  const [xato, setXato] = useState<string | null>(null);

  async function onFinish(values: Values): Promise<void> {
    setXato(null);
    try {
      await update.mutateAsync({
        name: values.name,
        phone: values.phone,
        address: values.address,
        // `null` — muddatsiz. Maydon bo'shatilsa aynan shu yuboriladi.
        subscriptionEndsAt: values.subscriptionEndsAt?.toISOString() ?? null,
      });
      message.success('Saqlandi');
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  return (
    <>
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}
      <Form<Values>
        layout="vertical"
        className="max-w-lg"
        initialValues={{
          name: org.name,
          phone: org.phone ?? undefined,
          address: org.address ?? undefined,
          subscriptionEndsAt: org.subscriptionEndsAt
            ? dayjs(org.subscriptionEndsAt)
            : null,
        }}
        onFinish={(values) => void onFinish(values)}
      >
        <Form.Item
          name="name"
          label="Nomi"
          rules={[{ required: true, message: 'Nomini kiriting' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Telefon">
          <Input placeholder="+998712000000" />
        </Form.Item>
        <Form.Item name="address" label="Manzil">
          <Input />
        </Form.Item>
        <Form.Item
          name="subscriptionEndsAt"
          label="Obuna tugash sanasi"
          extra="Bo‘sh qoldirilsa — muddatsiz"
        >
          <DatePicker className="w-full" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={update.isPending}>
          Saqlash
        </Button>
      </Form>
    </>
  );
}
