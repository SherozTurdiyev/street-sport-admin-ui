import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { useAuth } from './hooks';

type Values = { phone: string; password: string };

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFinish = async (values: Values) => {
    setError(null);
    setBusy(true);
    try {
      await login(values.phone.trim(), values.password);
    } catch (e) {
      // Matn backenddan keladi: "Telefon raqami yoki parol noto'g'ri",
      // "Hisob vaqtincha bloklangan" va hokazo. Frontend ularni qayta
      // yozmaydi.
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <Typography.Title level={4} className="!mb-6 text-center">
          Stadion boshqaruvi
        </Typography.Title>

        {error && (
          <Alert type="error" message={error} showIcon className="!mb-4" />
        )}

        <Form<Values> layout="vertical" onFinish={onFinish} disabled={busy}>
          <Form.Item
            name="phone"
            label="Telefon"
            rules={[{ required: true, message: 'Telefon raqamini kiriting' }]}
          >
            <Input placeholder="+998 90 123 45 67" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Parol"
            rules={[{ required: true, message: 'Parolni kiriting' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={busy}>
            Kirish
          </Button>
        </Form>
      </Card>
    </div>
  );
}
