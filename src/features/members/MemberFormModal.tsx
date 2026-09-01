import { useState } from 'react';
import { Alert, Form, Input, Modal, Select, Typography } from 'antd';
import { applyServerErrors, errorMessage } from '@/shared/api/error-handler';
import { ROLE_LABELS } from '@/shared/api/types';
import { useVenueOptions } from '@/features/venues/hooks';
import type { CreatableRole, CreatedMember } from './api';
import { useCreateMember } from './hooks';

type Values = {
  fullName: string;
  phone: string;
  role: CreatableRole;
  venueIds?: string[];
};

const ROLE_OPTIONS: { value: CreatableRole; label: string }[] = [
  { value: 'MANAGER', label: ROLE_LABELS.MANAGER },
  { value: 'VENUE_ADMIN', label: ROLE_LABELS.VENUE_ADMIN },
];

/**
 * Bu ROL BO'YICHA QAROR emas, backendning ma'lumot talabi: `VENUE_ADMIN`
 * uchun `venueIds` bo'sh bo'lsa server `MEMBER_VENUE_REQUIRED` qaytaradi.
 * Jadval ko'rinishida yozilgan — yangi rol qo'shilsa bitta qator
 * qo'shiladi, sharoit shoxlari ko'paymaydi.
 */
const NEEDS_VENUES: Record<CreatableRole, boolean> = {
  MANAGER: false,
  VENUE_ADMIN: true,
};

const FIELDS = ['fullName', 'phone', 'role', 'venueIds'] as const;

export function MemberFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm<Values>();
  const [umumiyXato, setUmumiyXato] = useState<string | null>(null);
  const [natija, setNatija] = useState<CreatedMember | null>(null);
  const create = useCreateMember();

  const role = Form.useWatch('role', form);
  const needsVenues = role !== undefined && NEEDS_VENUES[role];
  const venues = useVenueOptions(needsVenues);

  function yopish(): void {
    form.resetFields();
    setUmumiyXato(null);
    setNatija(null);
    onClose();
  }

  async function onFinish(values: Values): Promise<void> {
    setUmumiyXato(null);
    try {
      setNatija(
        await create.mutateAsync({
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          role: values.role,
          venueIds: values.venueIds ?? [],
        }),
      );
    } catch (e) {
      // Validatsiya xatosi maydonlarga tushadi; qolgani (telefon band,
      // stadion majburiy) forma tepasida ko'rsatiladi.
      if (!applyServerErrors(form, e, FIELDS)) setUmumiyXato(errorMessage(e));
    }
  }

  if (natija !== null) {
    return (
      <Modal
        open={open}
        title="Xodim yaratildi"
        onCancel={yopish}
        onOk={yopish}
        okText="Tushunarli"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>
          <Typography.Text strong>{natija.member.fullName}</Typography.Text>{' '}
          uchun vaqtinchalik parol:
        </p>
        <Typography.Title
          level={3}
          copyable={{ text: natija.temporaryPassword }}
        >
          {natija.temporaryPassword}
        </Typography.Title>
        <Alert
          type="warning"
          showIcon
          message="Bu parol boshqa ko'rsatilmaydi"
          description="Oynani yopgach parolni qayta olish imkoni yo'q. Uni hozir xodimga yetkazing — u birinchi kirishda o'zi yangi parol o'rnatadi."
        />
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      title="Yangi xodim"
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

      <Form<Values> form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="fullName"
          label="Ism va familiya"
          rules={[{ required: true, message: 'Ism va familiyani kiriting' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Telefon"
          rules={[
            { required: true, message: 'Telefon raqamini kiriting' },
            {
              pattern: /^\+998\d{9}$/,
              message: "Raqam +998XXXXXXXXX ko'rinishida bo'lishi kerak",
            },
          ]}
        >
          <Input placeholder="+998901234567" />
        </Form.Item>

        <Form.Item
          name="role"
          label="Lavozim"
          rules={[{ required: true, message: 'Lavozimni tanlang' }]}
        >
          <Select options={ROLE_OPTIONS} placeholder="Tanlang" />
        </Form.Item>

        {needsVenues && (
          <Form.Item
            name="venueIds"
            label="Stadionlar"
            rules={[
              {
                required: true,
                message: 'Kamida bitta stadion tanlang',
              },
            ]}
          >
            <Select
              mode="multiple"
              loading={venues.isPending}
              options={(venues.data ?? []).map((v) => ({
                value: v.id,
                label: v.name,
              }))}
              placeholder="Stadionlarni tanlang"
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
