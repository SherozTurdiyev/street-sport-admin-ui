import { useState } from 'react';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { figma } from '@/shared/theme/tokens';
import logoUrl from '@/assets/logo.svg';
import { useAuth } from './hooks';

type Values = { phone: string; password: string };

/**
 * Chap ustun — brend, o'ng ustun — forma (Figma 2001:4426).
 *
 * Figma maketidagi "Sign up for free", "Forgot Password?" va "Remember
 * me" ATAYLAB olinmadi: adminkada o'z-o'zidan ro'yxatdan o'tish yo'q
 * (hisobni direktor yoki menejer ochadi), parolni tiklash endpointi
 * mavjud emas, sessiya esa refresh cookie orqali allaqachon saqlanadi.
 * Ishlamaydigan havola ularni bor deb o'ylashga majbur qilardi.
 */
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
      // "Hisob vaqtincha bloklangan" va hokazo.
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Kichik ekranda brend ustuni yashiriladi: u ma'lumot bermaydi,
          forma esa butun ekranni egallaydi. */}
      <div
        className="hidden flex-col justify-center gap-6 p-16 lg:flex"
        style={{
          background: `linear-gradient(135deg, ${figma.bgSider} 0%, ${figma.bgCard} 100%)`,
          borderInlineEnd: `1px solid ${figma.border}`,
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            background: figma.primarySoft,
            border: `1px solid ${figma.primarySoftBorder}`,
          }}
        >
          <img src={logoUrl} alt="" width={44} height={44} />
        </div>

        <Typography.Title level={1} className="!mb-0 max-w-md">
          Stadion boshqaruvining yagona joyi
        </Typography.Title>

        <Typography.Paragraph
          className="!mb-0 max-w-md"
          style={{ color: figma.textMuted, fontSize: 16 }}
        >
          Maydonlar, ish vaqti, narxlar va bronlar — hammasi bitta panelda.
        </Typography.Paragraph>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div
            className="mb-6 flex items-center justify-center lg:hidden"
            style={{
              width: 56,
              height: 56,
              borderRadius: figma.radiusPill,
              background: figma.primary,
              boxShadow: `0 0 12px ${figma.primaryGlow}`,
            }}
          >
            <img src={logoUrl} alt="" width={32} height={32} />
          </div>

          <Typography.Title level={2} className="!mb-1">
            Xush kelibsiz
          </Typography.Title>
          <Typography.Paragraph style={{ color: figma.textMuted }}>
            Davom etish uchun hisobingizga kiring.
          </Typography.Paragraph>

          {error && (
            <Alert type="error" message={error} showIcon className="!mb-4" />
          )}

          <Form<Values> layout="vertical" onFinish={onFinish} disabled={busy}>
            <Form.Item
              name="phone"
              label="Telefon"
              rules={[{ required: true, message: 'Telefon raqamini kiriting' }]}
            >
              <Input
                size="large"
                prefix={<PhoneOutlined aria-hidden />}
                placeholder="+998 90 123 45 67"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Parol"
              rules={[{ required: true, message: 'Parolni kiriting' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined aria-hidden />}
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={busy}
            >
              Kirish
            </Button>
          </Form>

          <Typography.Paragraph
            className="!mb-0 !mt-6 text-center"
            style={{ color: figma.textMuted }}
          >
            Hisobingiz yo‘qmi? Uni tashkilot direktori yoki menejeri ochadi.
          </Typography.Paragraph>
        </div>
      </div>
    </div>
  );
}
