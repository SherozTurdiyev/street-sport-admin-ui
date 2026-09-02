import { useState } from 'react';
import { Alert, Form, Input, Modal, Typography } from 'antd';
import { applyServerErrors, errorMessage } from '@/shared/api/error-handler';
import type { CreatedOrganization } from './api';
import { useCreateOrganization } from './hooks';

type Values = {
  name: string;
  directorFullName: string;
  directorPhone: string;
};

const FIELDS = ['name', 'directorFullName', 'directorPhone'] as const;

export function OrganizationFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm<Values>();
  const [umumiyXato, setUmumiyXato] = useState<string | null>(null);
  const [natija, setNatija] = useState<CreatedOrganization | null>(null);
  const create = useCreateOrganization();

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
          name: values.name.trim(),
          director: {
            fullName: values.directorFullName.trim(),
            phone: values.directorPhone.trim(),
          },
        }),
      );
    } catch (e) {
      if (!applyServerErrors(form, e, FIELDS)) setUmumiyXato(errorMessage(e));
    }
  }

  if (natija !== null) {
    return (
      <Modal
        open={open}
        title="Tashkilot ochildi"
        onCancel={yopish}
        onOk={yopish}
        okText="Tushunarli"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>
          <Typography.Text strong>{natija.director.fullName}</Typography.Text>{' '}
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
          description="Oynani yopgach parolni qayta olish imkoni yo'q. Uni hozir direktorga yetkazing — u birinchi kirishda o'zi yangi parol o'rnatadi."
        />
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      title="Yangi tashkilot"
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

      <Typography.Paragraph type="secondary">
        Tashkilot va uning birinchi direktori birga yaratiladi.
      </Typography.Paragraph>

      <Form<Values> form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label="Tashkilot nomi"
          rules={[{ required: true, message: 'Tashkilot nomini kiriting' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="directorFullName"
          label="Direktor ismi"
          rules={[{ required: true, message: 'Direktor ismini kiriting' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="directorPhone"
          label="Direktor telefoni"
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
      </Form>
    </Modal>
  );
}
