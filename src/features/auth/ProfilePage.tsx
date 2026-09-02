import { useState } from 'react';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Descriptions,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { ROLE_LABELS } from '@/shared/api/types';
import { figma } from '@/shared/theme/tokens';
import { authApi } from './api';
import { ChangePasswordForm } from './ChangePasswordForm';
import { useAuth } from './hooks';

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

export function ProfilePage() {
  const { message } = App.useApp();
  const { me, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [xato, setXato] = useState<string | null>(null);

  if (!me) return null;

  async function barchasidanChiq(): Promise<void> {
    setXato(null);
    setBusy(true);
    try {
      await authApi.logoutAll();
      message.success('Barcha sessiyalar yopildi');
      await logout();
    } catch (e) {
      setXato(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Card>
        <Space size="large" align="center">
          <Avatar size={64} style={{ border: `1px solid ${figma.primary}` }}>
            {initials(me.fullName)}
          </Avatar>
          <div>
            <Typography.Title level={4} className="!mb-1">
              {me.fullName}
            </Typography.Title>
            <Tag color="blue">{ROLE_LABELS[me.role]}</Tag>
          </div>
        </Space>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Shaxsiy ma'lumotlar">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Ism va familiya">
              {me.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Telefon">{me.phone}</Descriptions.Item>
            <Descriptions.Item label="Lavozim">
              {ROLE_LABELS[me.role]}
            </Descriptions.Item>
          </Descriptions>

          {/*
            Tahrirlash tugmasi ATAYLAB yo'q: backendda foydalanuvchi o'z
            ismini yoki telefonini o'zgartiradigan endpoint mavjud emas.
            Ishlamaydigan tugma qo'yish uni bor deb o'ylashga majbur
            qilardi.
          */}
          <Alert
            className="!mt-4"
            type="info"
            showIcon
            message="Ma'lumotlarni tashkilot administratori o'zgartiradi"
            description="Ism yoki telefonni o'zgartirish kerak bo'lsa, direktor yoki menejerga murojaat qiling."
          />
        </Card>

        <Card title="Xavfsizlik">
          {xato !== null && (
            <Alert type="error" showIcon message={xato} className="!mb-4" />
          )}

          <ChangePasswordForm />

          <Typography.Paragraph type="secondary" className="!mb-2 !mt-6">
            Hisobingiz boshqa qurilmada ochiq qolgan bo'lishi mumkin.
          </Typography.Paragraph>
          <Popconfirm
            title="Barcha sessiyalar yopilsinmi?"
            description="Siz ham tizimdan chiqasiz va qaytadan kirishingiz kerak bo'ladi."
            okText="Ha"
            cancelText="Yo'q"
            onConfirm={() => void barchasidanChiq()}
          >
            <Button danger block loading={busy}>
              Barcha qurilmalardan chiqish
            </Button>
          </Popconfirm>
        </Card>
      </div>
    </Space>
  );
}
