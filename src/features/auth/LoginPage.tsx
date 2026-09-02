import { useState } from 'react';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Form, Input, Modal, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { figma } from '@/shared/theme/tokens';
import logoUrl from '@/assets/logo.svg';
import { useAuth } from './hooks';

type Values = { phone: string; password: string; remember: boolean };

/**
 * Figma 2001:4426. O'lchamlar maketdan: chap ustun 624, o'ng 816;
 * o'ngdagi blok 440 keng, maydonlar va tugma 56 baland, bloklar orasi
 * 24. Matn o'zbekcha — butun adminka shunday, maket esa inglizcha
 * namuna.
 */

/** Maketdagi ikkita havola — ikkalasi ham bir xil javob beradi. */
const YORDAM = {
  parol: {
    title: 'Parolni unutdingizmi?',
    body: 'Parolni o‘zingiz tiklay olmaysiz. Tashkilot direktori yoki menejeri sizga yangi vaqtinchalik parol beradi — u bilan kirganingizda tizim darhol yangi parol so‘raydi.',
  },
  hisob: {
    title: 'Hisob qanday ochiladi?',
    body: 'Adminkada o‘z-o‘zidan ro‘yxatdan o‘tish yo‘q. Hisobni tashkilot direktori yoki menejeri ochadi va sizga telefon raqamingiz bilan vaqtinchalik parol beradi.',
  },
} as const;

type YordamKaliti = keyof typeof YORDAM;

function BrandColumn() {
  return (
    <div
      className="relative hidden flex-col justify-center gap-8 p-16 lg:flex"
      style={{
        // Maketda bu yerda stadion fotosi turadi. Fotoning o'zi bizda
        // yo'q, shuning uchun uning o'rnini ayni rangdagi gradient
        // egallaydi — bo'sh joy qoldirishdan afzal.
        background: `radial-gradient(120% 100% at 20% 0%, ${figma.bgCard} 0%, ${figma.bgSider} 45%, #0b0219 100%)`,
        borderInlineEnd: `1px solid ${figma.border}`,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: figma.primarySoft,
          border: `1px solid ${figma.primarySoftBorder}`,
          boxShadow: `0 20px 60px ${figma.primaryGlow}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <img src={logoUrl} alt="" width={48} height={48} />
      </div>

      <Typography.Title
        level={1}
        className="!mb-0"
        style={{ fontSize: 40, lineHeight: '48px', maxWidth: 496 }}
      >
        Stadion boshqaruvining yagona joyi
      </Typography.Title>

      <Typography.Paragraph
        className="!mb-0"
        style={{ color: figma.textMuted, fontSize: 18, maxWidth: 496 }}
      >
        Maydonlar, ish vaqti, narxlar va bronlar — hammasi bitta panelda.
      </Typography.Paragraph>

      {/*
       * Maketda bu yerda "Join 10,000+ athletes today" va foydalanuvchi
       * rasmlari turadi. Bu adminka emas, ommaviy sayt uchun yozilgan
       * matn: bizda ro'yxatdan o'tish yo'q va bunday raqam ham yo'q.
       * Shakl saqlandi, mazmun esa haqiqiy.
       */}
      <div
        className="flex w-fit items-center gap-3 px-5 py-4"
        style={{
          background: 'rgba(27, 12, 54, 0.6)',
          border: `1px solid ${figma.border}`,
          borderRadius: figma.radiusPill,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex">
          {['Stadion', 'Bron', "To'lov"].map((nomi, i) => (
            <span
              key={nomi}
              title={nomi}
              className="flex items-center justify-center text-xs font-bold"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: figma.primarySoft,
                border: `1px solid ${figma.primarySoftBorder}`,
                color: figma.text,
                marginInlineStart: i === 0 ? 0 : -10,
              }}
            >
              {nomi.charAt(0)}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 14 }}>Stadion egalari uchun ish quroli</span>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [yordam, setYordam] = useState<YordamKaliti | null>(null);

  const onFinish = async (values: Values) => {
    setError(null);
    setBusy(true);
    try {
      await login(values.phone.trim(), values.password, values.remember);
    } catch (e) {
      // Matn backenddan keladi: "Telefon raqami yoki parol noto'g'ri",
      // "Hisob vaqtincha bloklangan" va hokazo.
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[624fr_816fr]">
      <BrandColumn />

      <div className="relative flex items-center justify-center p-6">
        {/* Maketdagi binafsha xiralashgan dog' — o'ng ustun foni. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: figma.primary,
            opacity: 0.18,
            filter: 'blur(120px)',
          }}
        />

        <div
          className="relative flex w-full flex-col gap-6"
          style={{ maxWidth: 440 }}
        >
          <div>
            <div
              className="mb-6 flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: figma.primary,
                boxShadow: `0 0 24px ${figma.primaryGlow}`,
              }}
            >
              <img src={logoUrl} alt="StreetSport" width={44} height={44} />
            </div>

            <Typography.Title
              level={2}
              className="!mb-2"
              style={{ fontSize: 32 }}
            >
              Xush kelibsiz
            </Typography.Title>
            <Typography.Paragraph
              className="!mb-0"
              style={{ color: figma.textMuted }}
            >
              Hisobingizga kirish uchun ma’lumotlaringizni kiriting.
            </Typography.Paragraph>
          </div>

          {error && <Alert type="error" message={error} showIcon />}

          <Form<Values>
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            disabled={busy}
          >
            {/* Maketda yorliqlar yo'q — ma'noni ikonka va joy egasi
                tashiydi. Ekran o'quvchisi uchun `aria-label` qoladi. */}
            <Form.Item
              name="phone"
              className="!mb-4"
              rules={[{ required: true, message: 'Telefon raqamini kiriting' }]}
            >
              <Input
                aria-label="Telefon"
                style={{ height: 56 }}
                prefix={
                  <PhoneOutlined aria-hidden style={{ color: figma.primary }} />
                }
                placeholder="Telefon raqami"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              className="!mb-3"
              rules={[{ required: true, message: 'Parolni kiriting' }]}
            >
              <Input.Password
                aria-label="Parol"
                style={{ height: 56 }}
                prefix={
                  <LockOutlined aria-hidden style={{ color: figma.primary }} />
                }
                placeholder="Parol"
                autoComplete="current-password"
              />
            </Form.Item>

            <div className="mb-6 flex items-center justify-between">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Meni eslab qol</Checkbox>
              </Form.Item>
              <Button
                type="link"
                className="!px-0"
                onClick={() => setYordam('parol')}
              >
                Parolni unutdingizmi?
              </Button>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={busy}
              style={{ height: 56, fontSize: 16, fontWeight: 700 }}
            >
              Boshqaruv paneliga kirish
            </Button>
          </Form>

          <div className="text-center" style={{ color: figma.textMuted }}>
            Hisobingiz yo‘qmi?{' '}
            <Button
              type="link"
              className="!px-0"
              onClick={() => setYordam('hisob')}
            >
              Qanday olish mumkin?
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={yordam !== null}
        title={yordam === null ? '' : YORDAM[yordam].title}
        footer={null}
        onCancel={() => setYordam(null)}
      >
        <Typography.Paragraph>
          {yordam === null ? '' : YORDAM[yordam].body}
        </Typography.Paragraph>
      </Modal>
    </div>
  );
}
