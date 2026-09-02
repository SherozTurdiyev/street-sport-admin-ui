import { Card, Typography } from 'antd';
import { ChangePasswordForm } from './ChangePasswordForm';
import { useAuth } from './hooks';

/**
 * Majburiy almashtirish sahifasi — LAYOUTDAN TASHQARIDA. Vaqtinchalik
 * parol bilan kirgan foydalanuvchiga boshqa hamma endpoint 403 qaytaradi,
 * shuning uchun unga menyu ko'rsatishning ma'nosi yo'q.
 */
export function ChangePasswordPage() {
  const { me } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <Typography.Title level={4} className="!mb-2">
          Parolni almashtiring
        </Typography.Title>
        {me?.mustChangePassword && (
          <Typography.Paragraph type="secondary">
            Sizga vaqtinchalik parol berilgan. Davom etish uchun uni
            almashtiring.
          </Typography.Paragraph>
        )}
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
