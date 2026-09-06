import { useState } from 'react';
import {
  Alert,
  App,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Switch,
  TimePicker,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { applyServerErrors, errorMessage } from '@/shared/api/error-handler';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import { TIME_PICKER_PANEL } from '@/shared/ui/timePicker';
import { WEEKDAYS } from '../enums';
import type { PriceRule, PriceRuleInput } from './api';
import { useCreatePriceRule, useUpdatePriceRule } from './hooks';

dayjs.extend(customParseFormat);

const TIME = 'HH:mm';
/** Backend mavsum chegarasini shu ko'rinishda kutadi. */
const DATE = 'YYYY-MM-DD';

type Values = {
  name?: string;
  isBase: boolean;
  weekdays?: number[];
  time?: [Dayjs, Dayjs] | null;
  season?: [Dayjs, Dayjs] | null;
  pricePerHour: string;
  priority: number;
};

const FIELDS = ['name', 'pricePerHour', 'priority'] as const;

/**
 * Hafta kunlari — yettala kun ham ro'yxatda ko'rinadi.
 *
 * Ilgari bu ko'p tanlovli `Select` edi: tanlangan kunlar teg bo'lib
 * maydonni to'ldirar, maydon esa o'sib ketardi — telefonda yetti teg
 * uch qatorni egallardi va qaysi kun tanlanmagani umuman ko'rinmasdi.
 * Bu yerda tanlov ish vaqti jadvali bilan bir xil ko'rinishda.
 *
 * `value`/`onChange` ni antd `Form.Item` beradi — komponent boshqariladi.
 */
function HaftaKunlari({
  value = [],
  onChange,
}: {
  value?: number[];
  onChange?: (kunlar: number[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {WEEKDAYS.map(({ value: kun, label }) => (
        <div key={kun} className="flex items-center gap-3">
          <Switch
            aria-label={label}
            checked={value.includes(kun)}
            onChange={(yoqilgan) =>
              onChange?.(
                yoqilgan
                  ? // Tartib O'SISH bo'yicha: server ham, audit
                    // jurnali ham massivni shundayligicha
                    // solishtiradi, aralash tartib esa "o'zgardi"
                    // deb ko'rinardi.
                    [...value, kun].sort((a, b) => a - b)
                  : value.filter((v) => v !== kun),
              )
            }
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function RuleForm({
  venueId,
  rule,
  onDone,
}: {
  venueId: string;
  rule: PriceRule | null;
  onDone: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [umumiyXato, setUmumiyXato] = useState<string | null>(null);
  const create = useCreatePriceRule(venueId);
  const update = useUpdatePriceRule(venueId, rule?.id ?? '');
  const busy = create.isPending || update.isPending;

  async function onFinish(values: Values): Promise<void> {
    setUmumiyXato(null);
    const [from, to] = values.time ?? [];
    const [seasonFrom, seasonTo] = values.season ?? [];
    /*
     * Har bir ixtiyoriy maydon ANIQ qiymat bilan ketadi: bo'shatilgani
     * `null`. `undefined` yuborilsa server "tegilmasin" deb tushunadi
     * va foydalanuvchi qo'ygan oraliqni bekor qila olmasdi — tahrirlash
     * yarim ishlagandek ko'rinardi.
     */
    const input: PriceRuleInput = {
      name: values.name?.trim() || null,
      isBase: values.isBase,
      weekdays: values.weekdays ?? [],
      startsTime: from ? from.format(TIME) : null,
      endsTime: to ? to.format(TIME) : null,
      // Narx SATR bo'lib qoladi: `InputNumber` ishlatilmaydi, chunki u
      // qiymatni songa aylantirib yuborardi (BR-13).
      pricePerHour: values.pricePerHour.trim(),
      validFrom: seasonFrom ? seasonFrom.format(DATE) : null,
      validTo: seasonTo ? seasonTo.format(DATE) : null,
      priority: values.priority,
    };
    try {
      if (rule) {
        await update.mutateAsync(input);
        message.success('Qoida yangilandi');
      } else {
        await create.mutateAsync(input);
        message.success("Qoida qo'shildi");
      }
      onDone();
    } catch (e) {
      // `PRICE_RULE_CONFLICT` va `PRICE_BASE_RULE_DUPLICATE` aynan shu
      // yerda ko'rsatiladi: xato foydalanuvchi tuzatadigan maydonlar
      // yonida turishi kerak.
      if (!applyServerErrors(form, e, FIELDS)) setUmumiyXato(errorMessage(e));
    }
  }

  return (
    <>
      {umumiyXato === null ? null : (
        <Alert type="error" showIcon message={umumiyXato} className="!mb-4" />
      )}

      <Form<Values>
        form={form}
        layout="vertical"
        id="price-rule-form"
        initialValues={{
          name: rule?.name ?? undefined,
          isBase: rule?.isBase ?? false,
          weekdays: rule?.weekdays ?? [],
          time:
            rule?.startsTime && rule.endsTime
              ? [dayjs(rule.startsTime, TIME), dayjs(rule.endsTime, TIME)]
              : null,
          season:
            rule?.validFrom && rule.validTo
              ? [dayjs(rule.validFrom), dayjs(rule.validTo)]
              : null,
          pricePerHour: rule?.pricePerHour ?? '',
          priority: rule?.priority ?? 0,
        }}
        onFinish={onFinish}
      >
        <Form.Item name="name" label="Nomi">
          <Input placeholder="Kechki" />
        </Form.Item>

        <Form.Item
          name="pricePerHour"
          label="Soatiga narx"
          extra="Butun son. Masalan: 260 000"
          rules={[
            { required: true, message: 'Narxni kiriting' },
            {
              pattern: /^\d+$/,
              message: 'Faqat raqam kiriting',
            },
          ]}
        >
          <MoneyInput placeholder="260 000" />
        </Form.Item>

        <Form.Item
          name="isBase"
          label="Bazaviy qoida"
          valuePropName="checked"
          extra="Boshqa qoida topilmaganda ishlaydi. Stadionda aynan bitta bo‘ladi."
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="weekdays"
          label="Hafta kunlari"
          extra="Bo‘sh qoldirilsa — barcha kunlar"
        >
          <HaftaKunlari />
        </Form.Item>

        <Form.Item name="time" label="Vaqt oralig‘i">
          <TimePicker.RangePicker
            className="w-full"
            format={TIME}
            {...TIME_PICKER_PANEL}
          />
        </Form.Item>

        <Form.Item
          name="season"
          label="Mavsum"
          extra="Bo‘sh qoldirilsa — muddatsiz. Masalan, faqat yozgi tarif"
        >
          <DatePicker.RangePicker format={DATE} className="w-full" />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Prioritet"
          extra="Bir vaqtga bir nechta qoida mos kelsa, kattasi yutadi"
        >
          <InputNumber className="w-full" />
        </Form.Item>
      </Form>

      <button hidden type="submit" form="price-rule-form" disabled={busy} />
    </>
  );
}

export function PriceRuleModal({
  venueId,
  open,
  rule,
  onClose,
}: {
  venueId: string;
  open: boolean;
  rule: PriceRule | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={rule ? 'Qoidani tahrirlash' : 'Yangi qoida'}
      okText="Saqlash"
      cancelText="Bekor qilish"
      onCancel={onClose}
      okButtonProps={{ htmlType: 'submit', form: 'price-rule-form' }}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Qoidani o‘zgartirish mavjud bronlarga ta’sir qilmaydi: bron yaratilganda
        o‘sha paytdagi narx nusxa qilib olinadi.
      </Typography.Paragraph>
      {open && <RuleForm venueId={venueId} rule={rule} onDone={onClose} />}
    </Modal>
  );
}
