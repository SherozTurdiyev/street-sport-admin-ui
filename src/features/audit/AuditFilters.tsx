import { DownloadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMembers } from '@/features/members/hooks';
import type { AuditFilters as Filters, AuditOption } from './api';

const DATE = 'DD.MM.YYYY';

export type FilterPatch = Partial<
  Record<'from' | 'to' | 'actorId' | 'action' | 'entityType', string | undefined>
>;

/**
 * Filtrlar URL da yashaydi (`patch` yuqoriga uzatiladi): direktor
 * topgan izni hamkasbiga havola qilib yubora oladi.
 */
export function AuditFilters({
  filters,
  actions,
  entityTypes,
  onChange,
  onExport,
  exporting,
}: {
  filters: Filters;
  actions: AuditOption[];
  entityTypes: AuditOption[];
  onChange: (patch: FilterPatch) => void;
  /** `null` — `export.data` ruxsati yo'q, tugma umuman chizilmaydi. */
  onExport: (() => void) | null;
  exporting: boolean;
}) {
  /*
   * Ro'yxatda bloklangan xodimlar HAM bo'ladi: ular ketgan bo'lsa ham
   * tarixdagi amallari qoladi va aynan ular qidiriladi.
   */
  const members = useMembers({ pageSize: 100 });

  const range: [Dayjs, Dayjs] | null =
    filters.from !== undefined && filters.to !== undefined
      ? [dayjs(filters.from), dayjs(filters.to)]
      : null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Space wrap size="middle">
        <DatePicker.RangePicker
          aria-label="Sana oralig‘i"
          format={DATE}
          allowClear
          value={range}
          onChange={(next) => {
            const [from, to] = (next ?? []) as (Dayjs | null)[];
            onChange({
              from: from?.format('YYYY-MM-DD'),
              to: to?.format('YYYY-MM-DD'),
            });
          }}
        />

        <Select
          aria-label="Xodim"
          placeholder="Xodim"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ minWidth: 200 }}
          loading={members.isPending}
          value={filters.actorId}
          onChange={(value?: string) => onChange({ actorId: value })}
          options={(members.data?.items ?? []).map((m) => ({
            value: m.userId,
            label: m.fullName,
          }))}
        />

        <Select
          aria-label="Amal"
          placeholder="Amal"
          mode="multiple"
          allowClear
          // `responsive` o'rniga aniq son: o'lchamga qarab hisoblash
          // tor ekranda "+ 0 ..." degan bo'sh hisoblagich chizib
          // qo'yardi.
          maxTagCount={2}
          style={{ minWidth: 220 }}
          value={filters.action ?? []}
          onChange={(value: string[]) =>
            onChange({ action: value.length > 0 ? value.join(',') : undefined })
          }
          options={actions}
        />

        <Select
          aria-label="Obyekt turi"
          placeholder="Obyekt turi"
          allowClear
          style={{ minWidth: 180 }}
          value={filters.entityType}
          onChange={(value?: string) => onChange({ entityType: value })}
          options={entityTypes}
        />
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
