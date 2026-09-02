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
} from 'antd';
import { applyServerErrors, errorMessage } from '@/shared/api/error-handler';
import type { VenueInput } from './api';
import {
  AMENITY_OPTIONS,
  SPORT_TYPE_OPTIONS,
  SURFACE_OPTIONS,
  type Amenity,
  type SportType,
  type Surface,
} from './enums';
import { useCreateVenue } from './hooks';

type Values = {
  name: string;
  sportType: SportType;
  surface?: Surface;
  sizeLabel?: string;
  isIndoor: boolean;
  city?: string;
  address?: string;
  contactPhone?: string;
  slotMinutes: number;
  amenities?: Amenity[];
  description?: string;
};

const FIELDS = ['name', 'sportType', 'city', 'contactPhone'] as const;

/** Backend standarti bilan bir xil: bron qadami 60 daqiqa. */
const DEFAULTS: Partial<Values> = { isIndoor: false, slotMinutes: 60 };

export function VenueFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [umumiyXato, setUmumiyXato] = useState<string | null>(null);
  const create = useCreateVenue();

  function yopish(): void {
    form.resetFields();
    setUmumiyXato(null);
    onClose();
  }

  async function onFinish(values: Values): Promise<void> {
    setUmumiyXato(null);
    const input: VenueInput = {
      ...values,
      name: values.name.trim(),
    };
    try {
      await create.mutateAsync(input);
      message.success('Stadion yaratildi');
      yopish();
    } catch (e) {
      if (!applyServerErrors(form, e, FIELDS)) setUmumiyXato(errorMessage(e));
    }
  }

  return (
    <Modal
      open={open}
      title="Yangi stadion"
      onCancel={yopish}
      onOk={() => void form.submit()}
      okText="Yaratish"
      cancelText="Bekor qilish"
      confirmLoading={create.isPending}
      destroyOnHidden
    >
      {umumiyXato === null ? null : (
        <Alert type="error" showIcon message={umumiyXato} className="!mb-4" />
      )}

      <Form<Values>
        form={form}
        layout="vertical"
        initialValues={DEFAULTS}
        onFinish={onFinish}
      >
        <Form.Item
          name="name"
          label="Nomi"
          rules={[{ required: true, message: 'Stadion nomini kiriting' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="sportType"
          label="Sport turi"
          rules={[{ required: true, message: 'Sport turini tanlang' }]}
        >
          <Select options={SPORT_TYPE_OPTIONS} placeholder="Tanlang" />
        </Form.Item>

        <Form.Item name="surface" label="Qoplama">
          <Select options={SURFACE_OPTIONS} allowClear placeholder="Tanlang" />
        </Form.Item>

        <Form.Item name="sizeLabel" label="O‘lchami">
          <Input placeholder="40x20" />
        </Form.Item>

        <Form.Item name="city" label="Shahar">
          <Input placeholder="Toshkent" />
        </Form.Item>

        <Form.Item name="address" label="Manzil">
          <Input />
        </Form.Item>

        <Form.Item name="contactPhone" label="Aloqa telefoni">
          <Input placeholder="+998712000000" />
        </Form.Item>

        <Form.Item
          name="slotMinutes"
          label="Bron qadami (daqiqa)"
          extra="60 bo‘lsa bron faqat butun soatdan boshlanadi"
        >
          <InputNumber min={30} max={60} step={30} className="w-full" />
        </Form.Item>

        <Form.Item name="isIndoor" label="Yopiq maydon" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="amenities" label="Qulayliklar">
          <Select mode="multiple" options={AMENITY_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item name="description" label="Tavsif">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
