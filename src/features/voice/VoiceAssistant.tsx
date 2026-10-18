import { useCallback, useState } from 'react';
import {
  AudioOutlined,
  CalendarOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Alert, Button, FloatButton, Modal, Spin, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { useCan } from '@/features/auth/hooks';
import { figma } from '@/shared/theme/tokens';
import { voiceApi, type Niyat } from './api';
import { useRecorder } from './useRecorder';
import { wavGaOtkaz } from './wav';

const SARLAVHA: Record<Niyat, string> = {
  BOOKING: 'Ovoz bilan bron qilish',
  PAYMENT: "Ovoz bilan to'lov qabul qilish",
};

const MISOL: Record<Niyat, string> = {
  BOOKING: 'Masalan: «Ertaga soat yettida Chilonzor arenaga bron qil»',
  PAYMENT: "Masalan: «Bu bronga ikki yuz ming so'm naqd to'lov»",
};

/** `93` → `1:33`. */
function vaqt(soniya: number): string {
  const d = Math.floor(soniya / 60);
  return `${d}:${String(soniya % 60).padStart(2, '0')}`;
}

/**
 * O'ng past burchakdagi ovozli yordamchi.
 *
 * Hozircha u faqat TANIGAN MATNNI ko'rsatadi. Matnni bron yoki to'lov
 * shakliga aylantirish keyingi bosqich: avval nutqni tanish zanjiri
 * uchdan-uchgacha ishlayotganiga ishonch hosil qilinadi.
 */
export function VoiceAssistant() {
  const can = useCan();
  const bronMumkin = can('booking.create');
  const tolovMumkin = can('payment.accept');

  const [niyat, setNiyat] = useState<Niyat | null>(null);
  const [matn, setMatn] = useState<string | null>(null);
  const [xato, setXato] = useState<string | null>(null);
  const [ishlanmoqda, setIshlanmoqda] = useState(false);
  const yozuv = useRecorder();

  const och = useCallback(
    async (tanlangan: Niyat) => {
      setNiyat(tanlangan);
      setMatn(null);
      setXato(null);
      try {
        await yozuv.boshla();
      } catch {
        // Eng ko'p uchraydigan sabab — foydalanuvchi ruxsat bermadi.
        setXato(
          'Mikrofonga ruxsat berilmadi. Brauzer manzil qatoridagi ' +
            'qulf belgisidan ruxsatni yoqing.',
        );
      }
    },
    [yozuv],
  );

  const yop = useCallback(() => {
    yozuv.bekor();
    setNiyat(null);
    setMatn(null);
    setXato(null);
    setIshlanmoqda(false);
  }, [yozuv]);

  const toxtatVaYubor = useCallback(async () => {
    setIshlanmoqda(true);
    setXato(null);
    try {
      const xomAudio = await yozuv.toxtat();
      const wav = await wavGaOtkaz(xomAudio);
      const natija = await voiceApi.transcribe(wav);
      setMatn(natija.text);
    } catch (e) {
      setXato(errorMessage(e));
    } finally {
      setIshlanmoqda(false);
    }
  }, [yozuv]);

  // Ikkala ruxsat ham yo'q bo'lsa yordamchining ma'nosi qolmaydi.
  if (!bronMumkin && !tolovMumkin) return null;

  return (
    <>
      <FloatButton.Group
        trigger="click"
        type="primary"
        icon={<AudioOutlined aria-hidden />}
        aria-label="Ovozli yordamchi"
        tooltip="Ovozli yordamchi"
      >
        {bronMumkin && (
          <FloatButton
            icon={<CalendarOutlined aria-hidden />}
            tooltip="Bron qilish"
            aria-label="Ovoz bilan bron qilish"
            onClick={() => void och('BOOKING')}
          />
        )}
        {tolovMumkin && (
          <FloatButton
            icon={<WalletOutlined aria-hidden />}
            tooltip="To‘lov qabul qilish"
            aria-label="Ovoz bilan to‘lov qabul qilish"
            onClick={() => void och('PAYMENT')}
          />
        )}
      </FloatButton.Group>

      <Modal
        open={niyat !== null}
        title={niyat === null ? '' : SARLAVHA[niyat]}
        onCancel={yop}
        maskClosable={false}
        footer={null}
        width="min(520px, 94vw)"
      >
        {niyat !== null && (
          <div className="flex flex-col items-center gap-4 py-4">
            {yozuv.holat === 'ruxsat' && (
              <Typography.Text type="secondary">
                Mikrofon ruxsati so‘ralmoqda…
              </Typography.Text>
            )}

            {yozuv.holat === 'yozilmoqda' && (
              <>
                <AudioOutlined
                  aria-hidden
                  style={{ fontSize: 44, color: figma.danger }}
                />
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {vaqt(yozuv.soniya)}
                </Typography.Title>
                <Typography.Text type="secondary" className="text-center">
                  {MISOL[niyat]}
                </Typography.Text>
                <Button type="primary" onClick={() => void toxtatVaYubor()}>
                  To‘xtatish va tanish
                </Button>
              </>
            )}

            {ishlanmoqda && (
              <>
                <Spin />
                <Typography.Text type="secondary">
                  Matnga o‘girilmoqda…
                </Typography.Text>
              </>
            )}

            {matn !== null && (
              <div className="w-full">
                <Typography.Text type="secondary">
                  Tanilgan matn:
                </Typography.Text>
                <Typography.Paragraph
                  copyable
                  className="!mt-2 !mb-4"
                  style={{ fontSize: 16 }}
                >
                  {matn}
                </Typography.Paragraph>
                <Button block onClick={() => void och(niyat)}>
                  Qaytadan aytish
                </Button>
              </div>
            )}

            {xato !== null && (
              <Alert className="w-full" type="error" showIcon message={xato} />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
