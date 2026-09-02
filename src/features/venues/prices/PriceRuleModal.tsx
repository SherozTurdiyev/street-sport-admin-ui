import { useState } from 'react';
import {
  Alert,
  App,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  TimePicker,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { applyServerErrors, errorMessage } from '@/shared/api/error-handler';
import { WEEKDAYS } from '../enums';
import type { PriceRule, PriceRuleInput } from './api';
import { useCreatePriceRule, useUpdatePriceRule } from './hooks';

dayjs.extend(customParseFormat);

const TIME = 'HH:mm';

type Values = {
  name?: string;
  isBase: boolean;
  weekdays?: number[];
  time?: [Dayjs, Dayjs] | null;
  pricePerHour: string;
  priority: number;
};

const FIELDS = ['name', 'pricePerHour', 'priority'] as const;

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
    const input: PriceRuleInput = {
      name: values.name?.trim(),
      isBase: values.isBase,
      weekdays: values.weekdays ?? [],
      startsTime: from?.format(TIME),
      endsTime: to?.format(TIME),
      // Narx SATR bo'lib qoladi: `InputNumber` ishlatilmaydi, chunki u
      // qiymatni songa aylantirib yuborardi (BR-13).
      pricePerHour: values.pricePerHour.trim(),
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
          extra="So‘mda, butun son"
          rules={[
            { required: true, message: 'Narxni kiriting' },
            {
              pattern: /^\d+$/,
              message: 'Faqat raqam kiriting',
            },
          ]}
        >
          <Input inputMode="numeric" placeholder="260000" />
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
          <Select
            mode="multiple"
            allowClear
            options={WEEKDAYS.map((d) => ({ value: d.value, label: d.label }))}
          />
        </Form.Item>

        <Form.Item name="time" label="Vaqt oralig‘i">
          <TimePicker.RangePicker format={TIME} minuteStep={15} />
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
