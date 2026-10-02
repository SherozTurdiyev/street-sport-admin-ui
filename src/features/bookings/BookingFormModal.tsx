import { useState } from 'react';
import {
  Alert,
  App,
  Checkbox,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
} from 'antd';
import dayjs from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatTime } from '@/shared/format/time';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { useCan } from '@/features/auth/hooks';
import type { Customer } from '@/features/customers/api';
import { useCustomerLookup } from '@/features/customers/hooks';
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from '@/features/payments/api';
import { useAcceptPaymentFor } from '@/features/payments/hooks';
import { useSlotPrice } from '@/features/venues/prices/hooks';
import type { CalendarVenue } from './api';
import type { Slot } from './slots';
import { useCreateBooking } from './hooks';

type Values = {
  multiplier: number;
  phone?: string;
  fullName?: string;
  chegirmaBor?: boolean;
  discount?: string;
  note?: string;
  payment?: string;
  paymentMethod?: PaymentMethod;
};

/** Pul SATR holida qoladi (BR-13) — hisob `BigInt` da. */
function ayir(jami: string, chegirma: string | undefined): bigint {
  const qoldiq =
    BigInt(jami) - BigInt(chegirma && chegirma !== '' ? chegirma : '0');
  return qoldiq > 0n ? qoldiq : 0n;
}

export type SelectedSlot = { venue: CalendarVenue; slot: Slot };

/**
 * Tez bron: stadion va vaqt katakdan keladi, foydalanuvchi faqat
 * mijozni ko'rsatadi.
 *
 * Narx frontendda HISOBLANMAYDI — u serverdan `calculate` orqali
 * keladi. Aks holda ikki tomonda ikki xil raqam paydo bo'lish xavfi
 * bor edi. Operator shu yerda darhol to'lov ham qabul qila oladi:
 * mijoz pulni o'yin oldidan beradi va buning uchun bronni qaytadan
 * ochish ortiqcha.
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

  const can = useCan();
  const tolovQabul = useAcceptPaymentFor();

  const { venue, slot } = selected;
  const step = venue.slotMinutes;

  const multiplier = Form.useWatch('multiplier', form) ?? 1;
  const chegirmaBor = Form.useWatch('chegirmaBor', form) ?? false;
  const kiritilganChegirma = Form.useWatch('discount', form);
  // Belgilanmagan bo'lsa chegirma YO'Q: maydonda eski qiymat qolib
  // ketgan bo'lsa ham hisobga olinmaydi. (`useWatch` shart ichida
  // chaqirilmaydi — hook tartibi buzilardi.)
  const chegirma = chegirmaBor ? kiritilganChegirma : undefined;
  const tolov = Form.useWatch('payment', form);
  const endsAt = dayjs(slot.startsAt)
    .add(step * multiplier, 'minute')
    .toISOString();

  const narx = useSlotPrice(venue.venueId, slot.startsAt, endsAt);
  // Bazaviy narx qoidasi yo'q stadionda bron ham yaratilmaydi, shuning
  // uchun bu yerda faqat to'lov qismi yashiriladi.
  const jami = narx.data?.totalPrice ?? null;
  const qarz = jami === null ? null : ayir(jami, chegirma);
  const tolovMumkin = can('payment.accept') && qarz !== null;

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
        discount: (values.chegirmaBor && values.discount) || undefined,
        note: values.note?.trim() || undefined,
      });

      const summa = values.payment;
      if (tolovMumkin && summa !== undefined && summa !== '' && summa !== '0') {
        try {
          await tolovQabul.mutateAsync({
            bookingId: natija.id,
            input: {
              amount: summa,
              method: values.paymentMethod ?? 'CASH',
            },
          });
          message.success('Bron yaratildi va to‘lov yozildi');
        } catch (e) {
          /*
           * Bron O'CHIRILMAYDI: vaqt band qilingan, mijoz kelmoqda va
           * operator hamma narsani qaytadan kiritishi kerak bo'lardi.
           * Eng ehtimolli sabab — naqd to'lov uchun ochiq smena yo'q.
           */
          message.warning(
            `Bron yaratildi, lekin to‘lov yozilmadi: ${errorMessage(e)} ` +
              'To‘lovni bron oynasidan qo‘shishingiz mumkin.',
          );
        }
      } else {
        message.success('Bron yaratildi');
      }

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

        <Form.Item name="note" label="Izoh">
          <Input />
        </Form.Item>

        {tolovMumkin && (
          <>
            <Form.Item
              name="payment"
              label="To‘lov"
              extra={
                <span>
                  {`Shu vaqt uchun: ${formatMoney(jami)}`}
                  {qarz !== null && jami !== null && BigInt(jami) !== qarz
                    ? ` · chegirmadan keyin: ${formatMoney(qarz.toString())}`
                    : ''}
                </span>
              }
              rules={[
                {
                  validator: (_q, qiymat: string | undefined) =>
                    qiymat === undefined ||
                    qiymat === '' ||
                    (qarz !== null && BigInt(qiymat) <= qarz)
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error('Summa qarzdan ko‘p bo‘lishi mumkin emas'),
                        ),
                },
              ]}
            >
              <MoneyInput />
            </Form.Item>

            {tolov !== undefined && tolov !== '' && (
              <Form.Item
                name="paymentMethod"
                label="To‘lov usuli"
                initialValue="CASH"
              >
                <Select options={PAYMENT_METHOD_OPTIONS} />
              </Form.Item>
            )}
          </>
        )}

        <Form.Item name="chegirmaBor" valuePropName="checked" className="!mb-2">
          <Checkbox
            onChange={() => {
              // Belgi olib tashlanganda qiymat TOZALANADI — ko'rinmaydigan
              // chegirma jimgina qo'llanib ketmasligi kerak.
              form.setFieldValue('discount', undefined);
              // To'lov chegarasi chegirmaga bog'liq: eski xato qolib
              // ketmasligi uchun maydon qayta tekshiriladi.
              void form.validateFields(['payment']).catch(() => undefined);
            }}
          >
            Chegirma berish
          </Checkbox>
        </Form.Item>

        {chegirmaBor && (
          <Form.Item name="discount" label="Chegirma">
            <MoneyInput
              onChange={() => {
                void form.validateFields(['payment']).catch(() => undefined);
              }}
            />
          </Form.Item>
        )}
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
      // Oynada endi narx, to'lov va chegirma ham bor — standart 520px
      // da maydonlar siqilib qolardi. Telefonda ekran kengligiga tushadi.
      width="min(640px, 94vw)"
      okButtonProps={{ htmlType: 'submit', form: 'booking-form' }}
      destroyOnHidden
    >
      {selected !== null && <Form_ selected={selected} onDone={onClose} />}
    </Modal>
  );
}
