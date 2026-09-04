import { DownloadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Space, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

const DATE = 'DD.MM.YYYY';

/**
 * Sana oralig'i sahifa darajasida: bir marta tanlanadi, tab'lar
 * orasida saqlanadi. Oraliq URL da yashaydi — hisobotga havola
 * yuborilganda qabul qiluvchi AYNAN o'sha raqamlarni ko'rishi kerak.
 */
export function RangeToolbar({
  range,
  onChange,
  disabledReason,
  onExport,
  exporting,
}: {
  range: { from?: string; to?: string };
  onChange: (patch: { from?: string; to?: string }) => void;
  /**
   * Oraliq olmaydigan hisobotlar uchun sabab matni. Tanlagichni
   * shunchaki o'chirib qo'yish "nimaga ishlamayapti?" degan savol
   * qoldirardi.
   */
  disabledReason: string | null;
  /** `null` — `export.data` ruxsati yo'q, tugma umuman chizilmaydi. */
  onExport: (() => void) | null;
  exporting: boolean;
}) {
  const value: [Dayjs, Dayjs] | null =
    range.from !== undefined && range.to !== undefined
      ? [dayjs(range.from), dayjs(range.to)]
      : null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Space wrap size="middle">
        <DatePicker.RangePicker
          aria-label="Sana oralig‘i"
          format={DATE}
          allowClear
          disabled={disabledReason !== null}
          value={value}
          onChange={(next) => {
            const [from, to] = (next ?? []) as (Dayjs | null)[];
            onChange({
              from: from?.format('YYYY-MM-DD'),
              to: to?.format('YYYY-MM-DD'),
            });
          }}
        />
        {disabledReason === null ? (
          <Typography.Text type="secondary">
            Berilmasa — joriy oy
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">{disabledReason}</Typography.Text>
        )}
      </Space>

      {onExport !== null && (
        <Button
          icon={<DownloadOutlined aria-hidden />}
          loading={exporting}
          onClick={onExport}
        >
          CSV yuklab olish
        </Button>
      )}
    </div>
  );
}
