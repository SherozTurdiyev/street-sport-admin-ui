import { useState } from 'react';
import { Alert, App, Form, Input, Modal, Select, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import { useVenueOptions } from '@/features/venues/hooks';
import type { CurrentShift } from './api';
import { useCloseShift, useOpenShift } from './hooks';

type OpenValues = { venueId: string; openingCash: string };

export function OpenShiftModal({
  venueId,
  open,
  onClose,
}: {
  /** Oldindan tanlangan stadion. */
  venueId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<OpenValues>();
  const [xato, setXato] = useState<string | null>(null);
  const stadionlar = useVenueOptions(open);
  const ochish = useOpenShift();

  return (
    <Modal
      open={open}
      title="Smenani ochish"
      okText="Ochish"
      cancelText="Bekor qilish"
      confirmLoading={ochish.isPending}
      onOk={() => void form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}
      <Typography.Paragraph type="secondary">
        Boshlang‘ich qoldiq — smena boshida kassada turgan pul. Odatda o‘tgan
        smenadan qolgan mayda pul.
      </Typography.Paragraph>
      <Form<OpenValues>
        form={form}
        layout="vertical"
        initialValues={{ venueId: venueId ?? undefined, openingCash: '0' }}
        onFinish={(values) =>
          void ochish
            .mutateAsync(values)
            .then(() => {
              message.success('Smena ochildi');
              onClose();
            })
            .catch((e: unknown) => setXato(errorMessage(e)))
        }
      >
        <Form.Item
          name="venueId"
          label="Stadion"
          rules={[{ required: true, message: 'Stadionni tanlang' }]}
        >
          <Select
            placeholder="Tanlang"
            loading={stadionlar.isPending}
            options={(stadionlar.data ?? []).map((v) => ({
              value: v.id,
              label: v.name,
            }))}
          />
        </Form.Item>
        <Form.Item name="openingCash" label="Boshlang‘ich qoldiq">
          <MoneyInput />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type CloseValues = { declaredCash: string; comment?: string };

/**
 * Yopishda kassir O'ZI sanagan summani kiritadi. Tizim hisoblagani
 * ham ko'rsatiladi — u baribir javobda chiqadi, yashirish esa halol
 * xodimni qorong'uda qoldirardi.
 *
 * Farq yopishga TO'SQINLIK QILMAYDI: aks holda kassir raqamni tizimga
 * moslab yozishga majbur bo'lardi va nazorat yo'qolardi.
 */
export function CloseShiftModal({
  shift,
  open,
  onClose,
}: {
  shift: CurrentShift;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CloseValues>();
  const [xato, setXato] = useState<string | null>(null);
  const yopish = useCloseShift(shift.id);

  return (
    <Modal
      open={open}
      title="Smenani yopish"
      okText="Yopish va yakunlash"
      cancelText="Bekor qilish"
      confirmLoading={yopish.isPending}
      onOk={() => void form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}
      <Alert
        className="!mb-4"
        type="info"
        showIcon
        message={`Tizim hisobi: ${formatMoney(shift.expectedCash)}`}
        description="Farq bo‘lsa ham smena yopiladi. Ikkala son ham saqlanadi va farq direktorga xabar qilinadi."
      />
      <Form<CloseValues>
        form={form}
        layout="vertical"
        initialValues={{ declaredCash: shift.expectedCash }}
        onFinish={(values) =>
          void yopish
            .mutateAsync(values)
            .then((r) => {
              message.success(
                r.difference === '0'
                  ? 'Smena yopildi, farq yo‘q'
                  : `Smena yopildi. Farq: ${formatMoney(r.difference ?? '0')}`,
              );
              onClose();
            })
            .catch((e: unknown) => setXato(errorMessage(e)))
        }
      >
        <Form.Item
          name="declaredCash"
          label="Sanalgan summa"
          rules={[{ required: true, message: 'Sanalgan summani kiriting' }]}
        >
          <MoneyInput autoFocus />
        </Form.Item>
        <Form.Item name="comment" label="Izoh">
          <Input.TextArea rows={2} placeholder="Farq sababi, agar bo‘lsa" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
