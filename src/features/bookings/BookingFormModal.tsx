import { useState } from 'react';
import { Alert, App, Descriptions, Form, Input, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import { formatTime } from '@/shared/format/time';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import type { Customer } from '@/features/customers/api';
import { useCustomerLookup } from '@/features/customers/hooks';
import type { CalendarVenue } from './api';
import type { Slot } from './slots';
import { useCreateBooking } from './hooks';

type Values = {
  multiplier: number;
  phone?: string;
  fullName?: string;
  discount?: string;
  note?: string;
};

export type SelectedSlot = { venue: CalendarVenue; slot: Slot };

/**
 * Tez bron: stadion va vaqt katakdan keladi, foydalanuvchi faqat
 * mijozni ko'rsatadi.
 *
 * Narx OLDINDAN ko'rsatilmaydi — uni server narx qoidalaridan
 * hisoblaydi. Frontendda takrorlansa, ikki tomonda ikki xil raqam
 * paydo bo'lish xavfi bor.
 */
function Form_({
  selected,
  onDone,
}: {
  selected: SelectedSlot;
  onDone: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [xato, setXato] = useState<string | null>(null);
  const [topilgan, setTopilgan] = useState<Customer | null>(null);
  const [ismSoraladi, setIsmSoraladi] = useState(false);
  const lookup = useCustomerLookup();
  const create = useCreateBooking();

  const { venue, slot } = selected;
  const step = venue.slotMinutes;

  async function qidir(): Promise<void> {
    const phone = (form.getFieldValue('phone') as string | undefined)?.trim();
    if (!phone) return;
    setXato(null);
    try {
      const natija = await lookup.mutateAsync({ phone });
      setTopilgan(natija.customer);
      // Raqam topilmadi: mijozni yaratish uchun ism kerak.
      setIsmSoraladi(natija.customer === null);
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  async function onFinish(values: Values): Promise<void> {
    setXato(null);
    const phone = values.phone?.trim();
    let customerId: string | undefined;

    try {
      if (phone) {
        const mijoz =
          topilgan ??
          (await lookup.mutateAsync({ phone, fullName: values.fullName }))
            .customer;
        if (!mijoz) {
          setIsmSoraladi(true);
          setXato('Bu raqam topilmadi — mijoz ismini kiriting.');
          return;
        }
        customerId = mijoz.id;
      }

      const natija = await create.mutateAsync({
        venueId: venue.venueId,
        customerId,
        startsAt: slot.startsAt,
        endsAt: dayjs(slot.startsAt)
          .add(step * values.multiplier, 'minute')
          .toISOString(),
        discount: values.discount || undefined,
        note: values.note?.trim() || undefined,
      });

      message.success('Bron yaratildi');
      // Qora ro'yxat bronni to'smaydi — qaror operatorda, lekin u
      // ogohlantirishni ko'rishi shart.
      if (natija.warnings.includes('CUSTOMER_BLACKLISTED')) {
        message.warning('Mijoz qora ro‘yxatda');
      }
      onDone();
    } catch (e) {
      setXato(errorMessage(e));
    }
  }

  return (
    <>
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}

      <Descriptions className="!mb-4" column={1} size="small">
        <Descriptions.Item label="Stadion">{venue.name}</Descriptions.Item>
        <Descriptions.Item label="Boshlanishi">
          {formatTime(slot.startsAt)}
        </Descriptions.Item>
      </Descriptions>

      <Form<Values>
        form={form}
        layout="vertical"
        id="booking-form"
        initialValues={{ multiplier: 1 }}
        onFinish={onFinish}
      >
        <Form.Item name="multiplier" label="Davomiyligi">
          <Select
            options={[1, 2, 3].map((n) => ({
              value: n,
              label: `${(step * n) / 60} soat`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Mijoz telefoni"
          extra="Bo‘sh qoldirilsa — anonim bron"
        >
          <PhoneInput onBlur={() => void qidir()} />
        </Form.Item>

        {topilgan !== null && (
          <Alert
            className="!mb-4"
            type="success"
            showIcon
            message={topilgan.fullName}
          />
        )}

        {ismSoraladi && (
          <Form.Item
            name="fullName"
            label="Mijoz ismi"
            extra="Bu raqam bazada yo‘q — yangi mijoz yaratiladi"
            rules={[{ required: true, message: 'Ismni kiriting' }]}
          >
            <Input />
          </Form.Item>
        )}

        <Form.Item name="discount" label="Chegirma">
          <MoneyInput />
        </Form.Item>

        <Form.Item name="note" label="Izoh">
          <Input />
        </Form.Item>
      </Form>
    </>
  );
}

export function BookingFormModal({
  selected,
  onClose,
}: {
  selected: SelectedSlot | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={selected !== null}
      title="Yangi bron"
      okText="Yaratish"
      cancelText="Bekor qilish"
      onCancel={onClose}
      okButtonProps={{ htmlType: 'submit', form: 'booking-form' }}
      destroyOnHidden
    >
      {selected !== null && <Form_ selected={selected} onDone={onClose} />}
    </Modal>
  );
}
