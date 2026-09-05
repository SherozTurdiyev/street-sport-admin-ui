import { useState } from 'react';
import { Alert, App, Button, Card, Space, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import { useCan } from '@/features/auth/hooks';
import { useUpdateOrganization } from './hooks';

/**
 * F12.3 — kassa farqi chegarasi.
 *
 * Farq HAR DOIM saqlanadi va smena hisobotida ko'rinadi; chegara faqat
 * bildirishnomaga ta'sir qiladi. Shuni matnda ochiq aytish kerak, aks
 * holda direktor "chegara qo'ysam, kichik farqlar yashiriladi" deb
 * o'ylashi mumkin.
 */
export function CashThresholdCard({ value }: { value: string }) {
  const can = useCan();
  const { message } = App.useApp();
  const update = useUpdateOrganization();
  const [draft, setDraft] = useState<string | null>(null);
  const [xato, setXato] = useState<string | null>(null);

  const tahrirlash = can('org.settings.update');
  const joriy = draft ?? value;

  async function saqla(): Promise<void> {
    setXato(null);
    try {
      await update.mutateAsync({ cashMismatchThreshold: joriy || '0' });
      setDraft(null);
      message.success('Chegara saqlandi');
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  return (
    <Card title="Kassa farqi chegarasi">
      <Space direction="vertical" size="middle" className="w-full">
        {xato !== null && <Alert type="error" showIcon message={xato} />}

        <Typography.Text type="secondary">
          Shu summadan oshgan farq direktorga bildirishnoma yuboradi.
          Nol — har qanday farq. Farqning o‘zi baribir saqlanadi va
          smena hisobotida ko‘rinadi.
        </Typography.Text>

        {tahrirlash ? (
          <Space wrap>
            <MoneyInput
              aria-label="Kassa farqi chegarasi"
              style={{ width: 200 }}
              value={joriy}
              onChange={setDraft}
            />
            <Button
              type="primary"
              loading={update.isPending}
              disabled={joriy === value}
              onClick={() => void saqla()}
            >
              Saqlash
            </Button>
          </Space>
        ) : (
          <Typography.Text strong style={{ fontSize: 18 }}>
            {formatMoney(value)}
          </Typography.Text>
        )}
      </Space>
    </Card>
  );
}
