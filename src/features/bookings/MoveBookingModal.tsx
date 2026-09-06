import { useState } from 'react';
import { Alert, App, DatePicker, Form, Modal, Select, TimePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  errorCode,
  errorDetails,
  errorMessage,
} from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { TASHKENT } from '@/shared/format/time';
import { TIME_PICKER_PANEL } from '@/shared/ui/timePicker';
import { useVenueOptions } from '@/features/venues/hooks';
import type { BookingCard, MoveBookingInput } from './api';
import { useMoveBooking } from './hooks';

dayjs.extend(customParseFormat);

const TIME = 'HH:mm';
const DATE = 'YYYY-MM-DD';

type Values = {
  venueId: string;
  date: Dayjs;
  time: Dayjs;
  hours: number;
};

/** Server tasdiq so'raganda javobda shu ikki narx keladi. */
type PriceChange = { oldPrice: string; newPrice: string };

export function MoveBookingModal({
  booking,
  open,
  onClose,
}: {
  booking: BookingCard;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [xato, setXato] = useState<string | null>(null);
  const [narx, setNarx] = useState<PriceChange | null>(null);
  const [kutilayotgan, setKutilayotgan] = useState<MoveBookingInput | null>(
    null,
  );
  const move = useMoveBooking(booking.id);
  const venues = useVenueOptions(open);

  const soatlar = dayjs(booking.endsAt).diff(dayjs(booking.startsAt), 'hour');

  async function yubor(input: MoveBookingInput): Promise<void> {
    setXato(null);
    try {
      await move.mutateAsync(input);
      message.success('Bron ko‘chirildi');
      setNarx(null);
      onClose();
    } catch (e) {
      /*
       * Tarif zonasi o'zgarganda server ataylab to'xtatadi va ikki
       * narxni beradi. Foydalanuvchi ularni ko'rib qaror qilishi kerak —
       * jimgina qimmatroq narxga ko'chirish mumkin emas.
       */
      if (errorCode(e) === 'BOOKING_PRICE_CHANGED') {
        const d = errorDetails<PriceChange>(e);
        if (d) {
          setNarx(d);
          setKutilayotgan(input);
          return;
        }
      }
      setXato(errorMessage(e));
    }
  }

  function onFinish(values: Values): void {
    const startsAt = dayjs
      .tz(
        `${values.date.format(DATE)} ${values.time.format(TIME)}`,
        `${DATE} ${TIME}`,
        TASHKENT,
      )
      .toISOString();

    void yubor({
      venueId: values.venueId,
      startsAt,
      endsAt: dayjs(startsAt).add(values.hours, 'hour').toISOString(),
    });
  }

  return (
    <>
      <Modal
        open={open && narx === null}
        title="Bronni ko‘chirish"
        okText="Ko‘chirish"
        cancelText="Yopish"
        okButtonProps={{ loading: move.isPending }}
        onOk={() => void form.submit()}
        onCancel={onClose}
        destroyOnHidden
      >
        {xato !== null && (
          <Alert className="!mb-4" type="error" showIcon message={xato} />
        )}

        <Form<Values>
          form={form}
          layout="vertical"
          initialValues={{
            venueId: booking.venue.id,
            date: dayjs(booking.startsAt).tz(TASHKENT),
            time: dayjs(booking.startsAt).tz(TASHKENT),
            hours: soatlar > 0 ? soatlar : 1,
          }}
          onFinish={onFinish}
        >
          <Form.Item name="venueId" label="Stadion">
            <Select
              loading={venues.isPending}
              options={(venues.data ?? []).map((v) => ({
                value: v.id,
                label: v.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="date" label="Sana">
            <DatePicker className="w-full" allowClear={false} format={DATE} />
          </Form.Item>
          <Form.Item name="time" label="Boshlanishi">
            <TimePicker
              className="w-full"
              allowClear={false}
              format={TIME}
              {...TIME_PICKER_PANEL}
            />
          </Form.Item>
          <Form.Item name="hours" label="Davomiyligi">
            <Select
              options={[1, 2, 3].map((n) => ({
                value: n,
                label: `${n} soat`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={narx !== null}
        title="Narx o‘zgaradi"
        okText="Tasdiqlash"
        cancelText="Bekor qilish"
        okButtonProps={{ loading: move.isPending }}
        onOk={() =>
          kutilayotgan &&
          void yubor({ ...kutilayotgan, confirmPriceChange: true })
        }
        onCancel={() => setNarx(null)}
      >
        <p>
          Eski narx: <b>{formatMoney(narx?.oldPrice)}</b>
        </p>
        <p>
          Yangi narx: <b>{formatMoney(narx?.newPrice)}</b>
        </p>
      </Modal>
    </>
  );
}
