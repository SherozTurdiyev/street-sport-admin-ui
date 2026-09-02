import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { errorDetails, errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { formatDateTime } from '@/shared/format/time';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { WEEKDAYS } from '@/features/venues/enums';
import { useVenueOptions } from '@/features/venues/hooks';
import type { Customer } from '@/features/customers/api';
import { useCustomerLookup } from '@/features/customers/hooks';
import {
  OCCURRENCE_VIEW,
  type Occurrence,
  type PreviewInput,
  type SeriesPreview,
} from './api';
import { useCreateSeries, useSeriesPreview } from './hooks';

dayjs.extend(customParseFormat);

const TIME = 'HH:mm';
const DATE = 'YYYY-MM-DD';

type Values = {
  venueId: string;
  weekdays: number[];
  time: Dayjs;
  hours: number;
  range: [Dayjs, Dayjs];
  phone?: string;
  fullName?: string;
};

function OccurrenceTable({ preview }: { preview: SeriesPreview }) {
  return (
    <Table<Occurrence>
      className="mt-4"
      rowKey="startsAt"
      size="small"
      pagination={false}
      scroll={{ y: 240 }}
      dataSource={preview.occurrences}
      columns={[
        {
          title: 'Sana',
          dataIndex: 'startsAt',
          render: (value: string) => formatDateTime(value),
        },
        {
          title: 'Holat',
          dataIndex: 'status',
          render: (value: Occurrence['status']) => (
            <Tag color={OCCURRENCE_VIEW[value].color}>
              {OCCURRENCE_VIEW[value].label}
            </Tag>
          ),
        },
      ]}
    />
  );
}

/**
 * Ikki qadam: avval OLDINDAN KO'RISH, keyin yaratish.
 *
 * Oldindan ko'rishsiz yo'l yo'q: 12 haftalik seriya 24 tagacha bron
 * degani va ularning qaysi biri band ekanini avval ko'rish kerak.
 */
function SeriesForm({ onDone }: { onDone: () => void }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [xato, setXato] = useState<string | null>(null);
  const [preview, setPreview] = useState<SeriesPreview | null>(null);
  const [input, setInput] = useState<PreviewInput | null>(null);
  const [mijoz, setMijoz] = useState<Customer | null>(null);
  const [ismSoraladi, setIsmSoraladi] = useState(false);

  const venues = useVenueOptions(true);
  const lookup = useCustomerLookup();
  const previewQuery = useSeriesPreview();
  const create = useCreateSeries();

  function toInput(values: Values): PreviewInput {
    const [from, to] = values.range;
    return {
      venueId: values.venueId,
      weekdays: values.weekdays,
      startTime: values.time.format(TIME),
      durationMinutes: values.hours * 60,
      startDate: from.format(DATE),
      endDate: to.format(DATE),
    };
  }

  async function korish(): Promise<void> {
    setXato(null);
    try {
      const values = await form.validateFields();
      const next = toInput(values);
      setInput(next);
      setPreview(await previewQuery.mutateAsync(next));
    } catch (e) {
      // Forma tekshiruvi o'z xabarini maydon ostida ko'rsatadi.
      if (e instanceof Error || 'code' in (e as object)) {
        setXato(errorMessage(e));
      }
    }
  }

  async function yarat(onConflict: 'SKIP' | 'ABORT'): Promise<void> {
    if (!input) return;
    setXato(null);
    const values = form.getFieldsValue();
    const phone = values.phone?.trim();
    if (!phone) {
      setXato('Seriya mijozga bog‘lanadi — telefon raqamini kiriting.');
      return;
    }

    try {
      const topilgan =
        mijoz ??
        (await lookup.mutateAsync({ phone, fullName: values.fullName }))
          .customer;
      if (!topilgan) {
        setIsmSoraladi(true);
        setXato('Bu raqam topilmadi — mijoz ismini kiriting.');
        return;
      }

      const natija = await create.mutateAsync({
        ...input,
        customerId: topilgan.id,
        onConflict,
      });

      message.success(`${natija.createdCount} ta bron yaratildi`);
      if (natija.skipped.length > 0) {
        message.warning(
          `${natija.skipped.length} ta sana band bo‘lgani uchun o‘tkazib yuborildi`,
        );
      }
      onDone();
    } catch (e) {
      const konflikt = errorDetails<{ conflicts?: unknown[] }>(e);
      setXato(
        konflikt?.conflicts
          ? `${errorMessage(e)} Band sanalar: ${konflikt.conflicts.length} ta.`
          : errorMessage(e),
      );
    }
  }

  const band = preview !== null && preview.free < preview.total;

  return (
    <>
      {xato !== null && (
        <Alert className="!mb-4" type="error" showIcon message={xato} />
      )}

      <Form<Values>
        form={form}
        layout="vertical"
        initialValues={{ hours: 1, weekdays: [] }}
        // Har o'zgarishda eski oldindan ko'rish yaroqsiz bo'ladi.
        onValuesChange={() => setPreview(null)}
      >
        <Form.Item
          name="venueId"
          label="Stadion"
          rules={[{ required: true, message: 'Stadionni tanlang' }]}
        >
          <Select
            loading={venues.isPending}
            options={(venues.data ?? []).map((v) => ({
              value: v.id,
              label: v.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="weekdays"
          label="Hafta kunlari"
          rules={[{ required: true, message: 'Kamida bitta kun tanlang' }]}
        >
          <Select
            mode="multiple"
            options={WEEKDAYS.map((d) => ({ value: d.value, label: d.label }))}
          />
        </Form.Item>

        <Form.Item
          name="time"
          label="Boshlanish vaqti"
          rules={[{ required: true, message: 'Vaqtni tanlang' }]}
        >
          <TimePicker
            className="w-full"
            format={TIME}
            minuteStep={15}
            allowClear={false}
          />
        </Form.Item>

        <Form.Item name="hours" label="Davomiyligi">
          <Select
            options={[1, 2, 3].map((n) => ({ value: n, label: `${n} soat` }))}
          />
        </Form.Item>

        <Form.Item
          name="range"
          label="Davri"
          extra="Eng ko‘pi 12 hafta (BR-10)"
          rules={[{ required: true, message: 'Davrni tanlang' }]}
        >
          <DatePicker.RangePicker className="w-full" format={DATE} />
        </Form.Item>

        <Form.Item name="phone" label="Mijoz telefoni">
          <PhoneInput
            onBlur={() => {
              const phone = (
                form.getFieldValue('phone') as string | undefined
              )?.trim();
              if (!phone) return;
              void lookup.mutateAsync({ phone }).then((r) => {
                setMijoz(r.customer);
                setIsmSoraladi(r.customer === null);
              });
            }}
          />
        </Form.Item>

        {mijoz !== null && (
          <Alert
            className="!mb-4"
            type="success"
            showIcon
            message={mijoz.fullName}
          />
        )}

        {ismSoraladi && (
          <Form.Item name="fullName" label="Mijoz ismi">
            <Input />
          </Form.Item>
        )}
      </Form>

      <Button
        block
        loading={previewQuery.isPending}
        onClick={() => void korish()}
      >
        Oldindan ko‘rish
      </Button>

      {preview !== null && (
        <>
          <Typography.Paragraph className="!mt-4" type="secondary">
            {`Jami ${preview.total} ta sana, bo‘sh ${preview.free} ta. Soatiga ${formatMoney(preview.pricePerHour)}.`}
          </Typography.Paragraph>

          <OccurrenceTable preview={preview} />

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {band && (
              <Button
                loading={create.isPending}
                onClick={() => void yarat('ABORT')}
              >
                Band sana bo‘lsa — yaratma
              </Button>
            )}
            <Button
              type="primary"
              loading={create.isPending}
              onClick={() => void yarat('SKIP')}
            >
              {band ? 'Bo‘sh sanalarga yaratish' : 'Yaratish'}
            </Button>
          </div>
        </>
      )}
    </>
  );
}

export function SeriesFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Yangi seriya"
      footer={null}
      onCancel={onClose}
      width={640}
      destroyOnHidden
    >
      {open && <SeriesForm onDone={onClose} />}
    </Modal>
  );
}
