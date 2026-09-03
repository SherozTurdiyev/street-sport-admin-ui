import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDateTime, formatTime } from '@/shared/format/time';
import { displayPhone } from '@/shared/format/phone';
import { PaymentsPanel } from '@/features/payments/PaymentsPanel';
import { BOOKING_STATUS_VIEW, type BookingCard } from './api';
import { useBookingCard, useSetBookingResult } from './hooks';
import { CancelBookingModal } from './CancelBookingModal';
import { MoveBookingModal } from './MoveBookingModal';

function Actions({ booking }: { booking: BookingCard }) {
  const { message } = App.useApp();
  const [koch, setKoch] = useState(false);
  const [bekor, setBekor] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const result = useSetBookingResult(booking.id);

  const tugagan = dayjs(booking.endsAt).isBefore(dayjs());
  const ochiq = booking.status !== 'CANCELLED';
  /*
   * Natija faqat o'yin tugagandan keyin qo'yiladi — server `endsAt`
   * gacha `BOOKING_NOT_FINISHED` qaytaradi. Ishlamaydigan tugmani
   * ko'rsatishdan ko'ra, uni umuman chizmagan ma'qul.
   */
  const natijaKerak = ochiq && tugagan && booking.status === 'CONFIRMED';

  async function belgila(value: 'COMPLETED' | 'NO_SHOW'): Promise<void> {
    setXato(null);
    try {
      await result.mutateAsync(value);
      message.success('Natija belgilandi');
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  return (
    <>
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}

      <Space wrap>
        {ochiq && <Button onClick={() => setKoch(true)}>Ko‘chirish</Button>}
        {natijaKerak && (
          <>
            <Button
              type="primary"
              loading={result.isPending}
              onClick={() => void belgila('COMPLETED')}
            >
              Yakunlandi
            </Button>
            <Button
              loading={result.isPending}
              onClick={() => void belgila('NO_SHOW')}
            >
              Kelmadi
            </Button>
          </>
        )}
        {ochiq && (
          <Button danger onClick={() => setBekor(true)}>
            Bekor qilish
          </Button>
        )}
      </Space>

      <MoveBookingModal
        booking={booking}
        open={koch}
        onClose={() => setKoch(false)}
      />
      <CancelBookingModal
        booking={booking}
        open={bekor}
        onClose={() => setBekor(false)}
      />
    </>
  );
}

/**
 * Bron kartochkasi — chekka oynada: kalendardan ochilganda orqadagi
 * panjara joyida qoladi. Ochilgan bron MANZILDA (`?booking=`), ya'ni
 * havolani yuborish mumkin.
 */
export function BookingDrawer({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data, isPending, error } = useBookingCard(id);

  return (
    <Drawer
      open={id !== null}
      onClose={onClose}
      width={520}
      title="Bron kartochkasi"
    >
      {error !== null ? (
        <Alert type="error" showIcon message={errorMessage(error)} />
      ) : isPending || !data ? (
        <Skeleton active />
      ) : (
        <Space direction="vertical" size="large" className="w-full">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Stadion">
              {data.venue.name}
            </Descriptions.Item>
            <Descriptions.Item label="Vaqt">
              {`${formatDateTime(data.startsAt)} – ${formatTime(data.endsAt)}`}
            </Descriptions.Item>
            <Descriptions.Item label="Mijoz">
              {data.customer === null ? (
                'Anonim'
              ) : (
                <Link to={`/customers/${data.customer.id}`}>
                  {data.customer.fullName}
                </Link>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Telefon">
              {displayPhone(data.customer?.phone)}
            </Descriptions.Item>
            <Descriptions.Item label="Narx">
              {formatMoney(data.priceTotal)}
            </Descriptions.Item>
            <Descriptions.Item label="Chegirma">
              {formatMoney(data.discount)}
            </Descriptions.Item>
            <Descriptions.Item label="Holat">
              <Tag color={BOOKING_STATUS_VIEW[data.status].color}>
                {BOOKING_STATUS_VIEW[data.status].label}
              </Tag>
            </Descriptions.Item>
            {data.cancelReason !== null && (
              <Descriptions.Item label="Bekor qilish sababi">
                {data.cancelReason}
              </Descriptions.Item>
            )}
            {data.seriesId !== null && (
              <Descriptions.Item label="Seriya">
                <Link to={`/bookings/series/${data.seriesId}`}>
                  Seriyani ochish
                </Link>
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Pul bo'limi amallardan YUQORIDA: kassada eng ko'p
              qilinadigan ish — to'lov qabul qilish, ko'chirish va
              bekor qilish esa kamdan-kam. */}
          <div>
            <Typography.Title level={5}>To‘lovlar</Typography.Title>
            <PaymentsPanel
              bookingId={data.id}
              cancelled={data.status === 'CANCELLED'}
            />
          </div>

          <Actions booking={data} />
        </Space>
      )}
    </Drawer>
  );
}
