import { useState } from 'react';
import { Alert, App, Button, Form, Input } from 'antd';
import { applyServerErrors, errorMessage } from '@/shared/api/error-handler';
import { ROLE_LABELS } from '@/shared/api/types';
import { authApi } from './api';
import { useAuth } from './hooks';

type Values = { fullName: string; phone: string };

const FIELDS = ['fullName', 'phone'] as const;

export function ProfileForm() {
  const { message } = App.useApp();
  const { me, applyMe } = useAuth();
  const [form] = Form.useForm<Values>();
  const [xato, setXato] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!me) return null;

  async function onFinish(values: Values): Promise<void> {
    setXato(null);
    setBusy(true);
    try {
      // Javob `GET /auth/me` bilan bir xil, shuning uchun holat
      // qo'shimcha so'rovsiz yangilanadi.
      applyMe(
        await authApi.updateProfile({
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
        }),
      );
      message.success('Ma’lumotlar saqlandi');
    } catch (e) {
      if (!applyServerErrors(form, e, FIELDS)) setXato(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {xato !== null && (
        <Alert type="error" showIcon message={xato} className="!mb-4" />
      )}

      <Form<Values>
        form={form}
        layout="vertical"
        initialValues={{ fullName: me.fullName, phone: me.phone }}
        onFinish={onFinish}
        disabled={busy}
      >
        <Form.Item
          name="fullName"
          label="Ism va familiya"
          rules={[
            { required: true, message: 'Ism va familiyani kiriting' },
            { min: 3, message: "Kamida 3 belgi bo'lishi kerak" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Telefon"
          // Telefon — TIZIMGA KIRISH identifikatori. O'zgargandan keyin
          // yangi raqam bilan kiriladi, eskisi ishlamaydi.
          extra="Bu raqam bilan tizimga kirasiz"
          rules={[
            { required: true, message: 'Telefon raqamini kiriting' },
            {
              pattern: /^\+998\d{9}$/,
              message: "Raqam +998XXXXXXXXX ko'rinishida bo'lishi kerak",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Lavozim" extra="Lavozimni direktor o‘zgartiradi">
          <Input value={ROLE_LABELS[me.role]} disabled />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={busy}>
          Saqlash
        </Button>
      </Form>
    </>
  );
}
