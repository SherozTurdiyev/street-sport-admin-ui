import { useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  AudioOutlined,
  CalendarOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Descriptions,
  FloatButton,
  Modal,
  Spin,
  Typography,
} from 'antd';
import { formatDateTime } from '@/shared/format/time';
import { displayPhone } from '@/shared/format/phone';
import { errorMessage } from '@/shared/api/error-handler';
import { useCan } from '@/features/auth/hooks';
import { figma } from '@/shared/theme/tokens';
import {
  BookingFormModal,
  type Boshlangich,
  type SelectedSlot,
} from '@/features/bookings/BookingFormModal';
import { voiceApi, type BuyruqTaklifi, type Niyat } from './api';
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
  const [taklif, setTaklif] = useState<BuyruqTaklifi | null>(null);
  const [xato, setXato] = useState<string | null>(null);
  const [ishlanmoqda, setIshlanmoqda] = useState(false);
  const [formOchiq, setFormOchiq] = useState(false);
  const yozuv = useRecorder();

  /*
   * Taklifdan bron oynasi uchun tanlov. Stadion yoki vaqt
   * aniqlanmagan bo'lsa `null` — oyna ochilmaydi va operator
   * kalendardan o'zi tanlaydi. Taxmin qilinmaydi.
   */
  const tanlov = useMemo<SelectedSlot | null>(() => {
    if (!taklif?.venueId || !taklif.startsAt || !taklif.slotMinutes) {
      return null;
    }
    return {
      venue: {
        venueId: taklif.venueId,
        name: taklif.venueName ?? '',
        slotMinutes: taklif.slotMinutes,
        status: 'ACTIVE',
        // Oyna bu uchtasini ishlatmaydi — panjara emas, bitta slot.
        hours: [],
        closures: [],
        bookings: [],
      },
      slot: {
        label: '',
        startsAt: taklif.startsAt,
        endsAt: taklif.endsAt ?? taklif.startsAt,
        status: 'FREE',
        booking: null,
      },
    };
  }, [taklif]);

  const boshlangich = useMemo<Boshlangich>(() => {
    if (taklif === null) return {};
    const daqiqa =
      taklif.startsAt !== null && taklif.endsAt !== null
        ? dayjs(taklif.endsAt).diff(taklif.startsAt, 'minute')
        : 0;
    const qadam = taklif.slotMinutes ?? 0;
    return {
      ...(taklif.phone !== null ? { phone: taklif.phone } : {}),
      ...(qadam > 0 && daqiqa > 0
        ? { multiplier: Math.max(1, Math.round(daqiqa / qadam)) }
        : {}),
      ...(taklif.amount !== null ? { payment: taklif.amount } : {}),
      ...(taklif.method !== null ? { paymentMethod: taklif.method } : {}),
    };
  }, [taklif]);

  const och = useCallback(
    async (tanlangan: Niyat) => {
      setNiyat(tanlangan);
      setMatn(null);
      setTaklif(null);
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
    setTaklif(null);
    setXato(null);
    setIshlanmoqda(false);
    setFormOchiq(false);
  }, [yozuv]);

  const toxtatVaYubor = useCallback(async (tanlangan: Niyat) => {
    setIshlanmoqda(true);
    setXato(null);
    try {
      const xomAudio = await yozuv.toxtat();
      const wav = await wavGaOtkaz(xomAudio);
      const natija = await voiceApi.transcribe(wav);
      setMatn(natija.text);
      // Matn DARHOL ko'rsatiladi, tushunish esa davom etadi: operator
      // nima eshitilganini kutmasdan ko'radi.
      setTaklif(await voiceApi.command(natija.text, tanlangan));
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

      {/* Bron oynasi ochilganda ovoz oynasi berkiladi — ikkitasi
          ustma-ust turib qolmasligi kerak. */}
      <Modal
        open={niyat !== null && !formOchiq}
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
                <Button
                  type="primary"
                  onClick={() => void toxtatVaYubor(niyat)}
                >
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
                <Typography.Paragraph className="!mt-2" style={{ fontSize: 16 }}>
                  {matn}
                </Typography.Paragraph>

                {taklif !== null && (
                  <>
                    {/* Operator JIMGINA to'ldirilgan formani emas,
                        nima tushunilganini ko'rishi kerak. */}
                    <Descriptions
                      size="small"
                      column={1}
                      className="!mb-4"
                      items={[
                        {
                          key: 'stadion',
                          label: 'Stadion',
                          children: taklif.venueName ?? '—',
                        },
                        {
                          key: 'vaqt',
                          label: 'Vaqt',
                          children:
                            taklif.startsAt === null
                              ? '—'
                              : formatDateTime(taklif.startsAt),
                        },
                        {
                          key: 'telefon',
                          label: 'Telefon',
                          children:
                            taklif.phone === null
                              ? '—'
                              : displayPhone(taklif.phone),
                        },
                      ]}
                    />

                    {tanlov === null && (
                      <Alert
                        className="!mb-3"
                        type="warning"
                        showIcon
                        message="Stadion yoki vaqt aniqlanmadi"
                        description="Oynani kalendardan oching yoki qaytadan ayting."
                      />
                    )}
                  </>
                )}

                <div className="flex gap-2">
                  <Button block onClick={() => void och(niyat)}>
                    Qaytadan aytish
                  </Button>
                  <Button
                    block
                    type="primary"
                    disabled={tanlov === null}
                    onClick={() => setFormOchiq(true)}
                  >
                    Oynani ochish
                  </Button>
                </div>
              </div>
            )}

            {xato !== null && (
              <div className="w-full">
                <Alert type="error" showIcon message={xato} />
                {/* Xatodan keyin CHIQISH YO'LI bo'lishi kerak. Matn
                    tanilmagan bo'lsa yuqoridagi tugmalar bloki
                    chizilmaydi, ya'ni oyna boshi berk ko'chaga
                    aylanardi. */}
                {matn === null && yozuv.holat === 'tayyor' && !ishlanmoqda && (
                  <Button
                    block
                    type="primary"
                    className="!mt-3"
                    onClick={() => void och(niyat)}
                  >
                    Qaytadan aytish
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <BookingFormModal
        selected={formOchiq ? tanlov : null}
        boshlangich={boshlangich}
        title="Ovoz bilan bron"
        onClose={yop}
      />
    </>
  );
}
