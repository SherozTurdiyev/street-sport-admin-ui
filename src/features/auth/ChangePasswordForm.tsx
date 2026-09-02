import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { authApi } from './api';
import { useAuth } from './hooks';

type Values = { currentPassword: string; newPassword: string; repeat: string };

/**
 * Ikki joyda ishlatiladi: majburiy almashtirish sahifasida va profilda.
 * Muvaffaqiyat matni ikkalasida ham bir xil — backend parol almashgach
 * BARCHA sessiyalarni yopadi va foydalanuvchi qayta kirishi kerak.
 */
export function ChangePasswordForm() {
  const { logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onFinish = async (values: Values) => {
    setError(null);
    setBusy(true);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <>
        <Alert
          type="success"
          showIcon
          message="Parol almashtirildi"
          // Buni aytmasak, foydalanuvchi keyingi so'rovda sababsiz login
          // sahifasiga tushib, tizimni nosoz deb o'ylardi.
          description="Xavfsizlik uchun barcha qurilmalardagi sessiyalar yopildi. Yangi parol bilan qaytadan kiring."
          className="!mb-4"
        />
        <Button type="primary" block onClick={() => void logout()}>
          Kirish sahifasiga
        </Button>
      </>
    );
  }

  return (
    <>
      {error && (
        <Alert type="error" message={error} showIcon className="!mb-4" />
      )}

      <Form<Values> layout="vertical" onFinish={onFinish} disabled={busy}>
        <Form.Item
          name="currentPassword"
          label="Joriy parol"
          rules={[{ required: true, message: 'Joriy parolni kiriting' }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Yangi parol"
          rules={[
            { required: true, message: 'Yangi parolni kiriting' },
            // Klientda faqat SHAKL tekshiriladi. Qolgan qoidalar
            // serverda va ular bu yerda takrorlanmaydi.
            { min: 8, message: "Kamida 8 belgi bo'lishi kerak" },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="repeat"
          label="Yangi parolni takrorlang"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Parolni takrorlang' },
            ({ getFieldValue }) => ({
              validator: (_, value: string) =>
                !value || getFieldValue('newPassword') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Parollar mos kelmadi')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={busy}>
          Parolni yangilash
        </Button>
      </Form>
    </>
  );
}
