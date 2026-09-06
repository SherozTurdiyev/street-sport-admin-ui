import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { errorCode, errorMessage } from '@/shared/api/error-handler';
import { formatDateTime, tashkentToIso } from '@/shared/format/time';
import { SHOW_TIME } from '@/shared/ui/timePicker';
import {
  CANCEL_REASON_LABELS,
  type CancelReason,
} from '@/features/bookings/api';
import type { VenueClosure } from './api';
import { useAddClosure, useRemoveClosure, useVenue } from './hooks';

const PICKER_FORMAT = 'YYYY-MM-DD HH:mm';

type Values = {
  range: [Dayjs, Dayjs];
  reason: string;
  cancelReason?: CancelReason;
};

const CANCEL_OPTIONS = (
  Object.keys(CANCEL_REASON_LABELS) as CancelReason[]
).map((value) => ({ value, label: CANCEL_REASON_LABELS[value] }));

export function ClosuresTab({ venueId }: { venueId: string }) {
  const { message } = App.useApp();
  const { data } = useVenue(venueId);
  const [form] = Form.useForm<Values>();
  const add = useAddClosure(venueId);
  const remove = useRemoveClosure(venueId);
  const [xato, setXato] = useState<string | null>(null);
  /**
   * Davrda bron bo'lsa backend 409 qaytaradi. Darrov `cancelBookings`
   * yuborish noto'g'ri bo'lardi: to'siq aynan bronlar jimgina yo'qolib
   * qolmasligi uchun qo'yilgan. Tasdiq faqat 409 kelgandan keyin
   * so'raladi.
   */
  const [tasdiqKerak, setTasdiqKerak] = useState(false);

  if (!data) return null;

  async function saqlash(
    values: Values,
    cancelBookings: boolean,
  ): Promise<void> {
    setXato(null);
    const [from, to] = values.range;
    try {
      await add.mutateAsync({
        // Devor soati Toshkent vaqti deb o'qiladi — stadion o'sha yerda.
        startsAt: tashkentToIso(from.format(PICKER_FORMAT)),
        endsAt: tashkentToIso(to.format(PICKER_FORMAT)),
        reason: values.reason.trim(),
        ...(cancelBookings
          ? {
              cancelBookings: true,
              cancelReason: values.cancelReason ?? 'VENUE_ISSUE',
            }
          : {}),
      });
      message.success('Yopilish qo‘shildi');
      form.resetFields();
      setTasdiqKerak(false);
    } catch (e) {
      setXato(errorMessage(e));
      if (errorCode(e) === 'VENUE_CLOSURE_HAS_BOOKINGS') setTasdiqKerak(true);
    }
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      {xato !== null && <Alert type="error" showIcon message={xato} />}

      <Form<Values>
        form={form}
        layout="vertical"
        onFinish={(values) => void saqlash(values, tasdiqKerak)}
      >
        <Form.Item
          name="range"
          label="Davr"
          rules={[{ required: true, message: 'Davrni tanlang' }]}
        >
          <DatePicker.RangePicker
            placeholder={['Boshlanishi', 'Tugashi']}
            showTime={SHOW_TIME}
            format={PICKER_FORMAT}
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Sabab"
          rules={[{ required: true, message: 'Sababni yozing' }]}
        >
          <Input placeholder="Maydon ta’miri" />
        </Form.Item>

        {tasdiqKerak && (
          <Form.Item
            name="cancelReason"
            label="Bronlarni bekor qilish sababi"
            extra="Bekor qilingan bronlar keyin AVTOMATIK tiklanmaydi — ular qo‘lda qayta yaratiladi."
          >
            <Select options={CANCEL_OPTIONS} placeholder="Stadion muammosi" />
          </Form.Item>
        )}

        <Button
          type="primary"
          htmlType="submit"
          danger={tasdiqKerak}
          loading={add.isPending}
        >
          {tasdiqKerak ? 'Bronlarni bekor qilib yopish' : 'Yopilish qo‘shish'}
        </Button>
      </Form>

      <Table<VenueClosure>
        scroll={{ x: 'max-content' }}
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={data.closures}
        columns={[
          {
            title: 'Boshlanishi',
            dataIndex: 'startsAt',
            render: (v: string) => formatDateTime(v),
          },
          {
            title: 'Tugashi',
            dataIndex: 'endsAt',
            render: (v: string) => formatDateTime(v),
          },
          { title: 'Sabab', dataIndex: 'reason' },
          {
            title: '',
            render: (_, row: VenueClosure) => (
              <Popconfirm
                title="Yopilish bekor qilinsinmi?"
                description="Bekor qilingan bronlar tiklanmaydi."
                okText="Ha"
                cancelText="Yo‘q"
                onConfirm={() =>
                  void remove
                    .mutateAsync(row.id)
                    .then(() => message.success('Yopilish bekor qilindi'))
                    .catch((e: unknown) => setXato(errorMessage(e)))
                }
              >
                <Button type="text" danger size="small">
                  Bekor qilish
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Typography.Text type="secondary">
        Yopilish davridagi bronlar bekor qilinsa, ular keyin avtomatik
        tiklanmaydi.
      </Typography.Text>
    </Space>
  );
}
