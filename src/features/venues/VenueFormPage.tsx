import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Space,
  Switch,
} from 'antd';
import { useNavigate, useParams } from 'react-router';
import { applyServerErrors, errorMessage } from '@/shared/api/error-handler';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import type { Venue, VenueInput } from './api';
import {
  AMENITY_OPTIONS,
  SPORT_TYPE_OPTIONS,
  SURFACE_OPTIONS,
  type Amenity,
  type SportType,
  type Surface,
} from './enums';
import { useCreateVenue, useUpdateVenue, useVenue } from './hooks';

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

/** Serverdagi stadionni forma qiymatlariga o'giradi. */
function toValues(venue: Venue): Values {
  return {
    name: venue.name,
    sportType: venue.sportType,
    surface: venue.surface ?? undefined,
    sizeLabel: venue.sizeLabel ?? undefined,
    isIndoor: venue.isIndoor,
    city: venue.city ?? undefined,
    address: venue.address ?? undefined,
    contactPhone: venue.contactPhone ?? undefined,
    slotMinutes: venue.slotMinutes,
    amenities: venue.amenities,
    description: venue.description ?? undefined,
  };
}

function VenueForm({ venue }: { venue: Venue | null }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<Values>();
  const [umumiyXato, setUmumiyXato] = useState<string | null>(null);
  const create = useCreateVenue();
  const update = useUpdateVenue(venue?.id ?? '');
  const busy = create.isPending || update.isPending;

  async function onFinish(values: Values): Promise<void> {
    setUmumiyXato(null);
    const input: VenueInput = { ...values, name: values.name.trim() };
    try {
      if (venue) {
        await update.mutateAsync(input);
        message.success('Stadion yangilandi');
        void navigate(`/venues/${venue.id}`);
      } else {
        const yaratilgan = await create.mutateAsync(input);
        message.success('Stadion yaratildi');
        // Yaratgandan keyin darrov o'z sahifasiga: keyingi qadam —
        // ish vaqti va bazaviy narx, ularsiz bron yaratib bo'lmaydi.
        void navigate(`/venues/${yaratilgan.id}`);
      }
    } catch (e) {
      if (!applyServerErrors(form, e, FIELDS)) setUmumiyXato(errorMessage(e));
    }
  }

  return (
    <Card title={venue ? 'Stadionni tahrirlash' : 'Yangi stadion'}>
      {umumiyXato === null ? null : (
        <Alert type="error" showIcon message={umumiyXato} className="!mb-4" />
      )}

      <Form<Values>
        form={form}
        layout="vertical"
        initialValues={venue ? toValues(venue) : DEFAULTS}
        onFinish={onFinish}
        disabled={busy}
      >
        {/*
         * Ikki ustun faqat keng ekranda. Oynada bu forma bitta uzun
         * ro'yxat edi va yarmi ko'rinmasdi — sahifada esa joy bor.
         */}
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
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
            <Select
              options={SURFACE_OPTIONS}
              allowClear
              placeholder="Tanlang"
            />
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
            <PhoneInput />
          </Form.Item>

          <Form.Item
            name="slotMinutes"
            label="Bron qadami (daqiqa)"
            extra="60 bo‘lsa bron faqat butun soatdan boshlanadi"
          >
            <InputNumber min={30} max={60} step={30} className="w-full" />
          </Form.Item>
        </div>

        <Form.Item name="amenities" label="Qulayliklar">
          <Select mode="multiple" options={AMENITY_OPTIONS} allowClear />
        </Form.Item>

        <Form.Item name="description" label="Tavsif">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="isIndoor" label="Yopiq maydon" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Space wrap>
          <Button type="primary" htmlType="submit" loading={busy}>
            {venue ? 'Saqlash' : 'Yaratish'}
          </Button>
          <Button onClick={() => void navigate(-1)}>Bekor qilish</Button>
        </Space>
      </Form>
    </Card>
  );
}

/**
 * Stadion yaratish va tahrirlash — ALOHIDA SAHIFA, oyna emas.
 *
 * Formada o'n uchta maydon bor: oynada ular tor ustunga siqilib,
 * telefonda esa yarmi ekrandan chiqib ketardi. Sahifa bo'lgani uchun
 * manzilni yuborish va brauzer tugmasi bilan qaytish ham ishlaydi.
 */
export function VenueFormPage() {
  const { id } = useParams<{ id: string }>();
  const venue = useVenue(id ?? null);

  if (id === undefined) return <VenueForm venue={null} />;

  if (venue.error !== null) {
    return <Alert type="error" showIcon message={errorMessage(venue.error)} />;
  }
  if (venue.isPending || !venue.data) return <Skeleton active />;

  return <VenueForm venue={venue.data} />;
}
