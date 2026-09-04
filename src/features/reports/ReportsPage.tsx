import { useState } from 'react';
import { App, Tabs, Typography } from 'antd';
import { useSearchParams } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { useCan } from '@/features/auth/hooks';
import { NoSectionsPage } from '@/shared/ui/NoSectionsPage';
import { reportsApi, type ReportName } from './api';
import { RangeToolbar } from './RangeToolbar';
import { SummaryTab } from './tabs/SummaryTab';
import { VenuesTab } from './tabs/VenuesTab';
import { MethodsTab } from './tabs/MethodsTab';
import { OccupancyTab } from './tabs/OccupancyTab';
import { CancellationsTab } from './tabs/CancellationsTab';
import { DebtorsTab } from './tabs/DebtorsTab';
import { StaffTab } from './tabs/StaffTab';

type TabKey =
  | 'summary'
  | 'venues'
  | 'methods'
  | 'occupancy'
  | 'cancellations'
  | 'debtors'
  | 'staff';

type TabDef = {
  key: TabKey;
  label: string;
  permission: string;
  /** Backend nomi — CSV yuklashda ishlatiladi. */
  report: ReportName;
  /**
   * Sana oralig'ini olmaydigan hisobotlar uchun sabab. `null` — oraliq
   * ishlaydi.
   */
  rangeless: string | null;
};

/**
 * Tab, ruxsat va backend nomi BITTA joyda. Ular ajralib qolsa,
 * ko'rinadigan, lekin 403 qaytaradigan tab paydo bo'lardi — bu
 * foydalanuvchi uchun eng chalg'ituvchi holat.
 */
const TABS: readonly TabDef[] = [
  {
    key: 'summary',
    label: 'Tushum',
    permission: 'report.profit.total',
    report: 'summary',
    rangeless: 'Davrlar qat’iy: bugun, hafta va oy',
  },
  {
    key: 'venues',
    label: 'Stadionlar',
    permission: 'report.profit.by_venue',
    report: 'revenue-by-venue',
    rangeless: null,
  },
  {
    key: 'methods',
    label: 'To‘lov usuli',
    permission: 'report.profit.total',
    report: 'revenue-by-method',
    rangeless: null,
  },
  {
    key: 'occupancy',
    label: 'Bandlik',
    permission: 'report.occupancy',
    report: 'occupancy',
    rangeless: null,
  },
  {
    key: 'cancellations',
    label: 'Bekor qilish',
    permission: 'report.cancellations',
    report: 'cancellations',
    rangeless: null,
  },
  {
    key: 'debtors',
    label: 'Qarzdorlar',
    permission: 'report.debtors',
    report: 'debtors',
    rangeless: 'Qarzdorlik — joriy holat, davr tanlanmaydi',
  },
  {
    key: 'staff',
    label: 'Xodimlar',
    permission: 'report.staff',
    report: 'staff',
    rangeless: null,
  },
];

/**
 * Hisobotlar bo'limi (M10).
 *
 * Tanlangan tab va sana oralig'i URL da yashaydi: hisobotga havola
 * yuborilganda qabul qiluvchi AYNAN o'sha raqamlarni ko'rishi kerak,
 * "menda boshqacha chiqyapti" degan suhbat bo'lmasin.
 */
export function ReportsPage() {
  const can = useCan();
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [yuklanmoqda, setYuklanmoqda] = useState(false);

  const ochiqTablar = TABS.filter((t) => can(t.permission));
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  // Ruxsat yo'q tab URL da so'ralsa, birinchi ochiq tabga tushadi:
  // bo'sh ekran ko'rsatishdan ko'ra ishlaydigan hisobot afzal.
  const soralgan = searchParams.get('tab');
  const faol =
    ochiqTablar.find((t) => t.key === soralgan) ?? ochiqTablar[0] ?? null;

  function patchParams(patch: Record<string, string | undefined>): void {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  if (faol === null) return <NoSectionsPage />;

  async function eksport(): Promise<void> {
    if (faol === null) return;
    setYuklanmoqda(true);
    try {
      await reportsApi.downloadCsv(faol.report, { from, to });
    } catch (e: unknown) {
      message.error(errorMessage(e));
    } finally {
      setYuklanmoqda(false);
    }
  }

  const range = faol.rangeless === null ? { from, to } : {};

  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={2} style={{ margin: 0 }}>
        Hisobotlar
      </Typography.Title>

      <RangeToolbar
        range={{ from, to }}
        onChange={(patch) => patchParams(patch)}
        disabledReason={faol.rangeless}
        // Eksport alohida ruxsat talab qiladi (backend `export.data`).
        // Ishlamaydigan tugma ko'rsatishning ma'nosi yo'q.
        onExport={can('export.data') ? () => void eksport() : null}
        exporting={yuklanmoqda}
      />

      <Tabs
        activeKey={faol.key}
        onChange={(key) => patchParams({ tab: key })}
        items={ochiqTablar.map((tab) => ({
          key: tab.key,
          label: tab.label,
          // Yopiq tab ma'lumot so'ramaydi: antd faqat faol panelni
          // chizadi, ya'ni hook ham ishga tushmaydi.
          children:
            tab.key === 'summary' ? (
              <SummaryTab />
            ) : tab.key === 'venues' ? (
              <VenuesTab range={range} />
            ) : tab.key === 'methods' ? (
              <MethodsTab range={range} />
            ) : tab.key === 'occupancy' ? (
              <OccupancyTab range={range} />
            ) : tab.key === 'cancellations' ? (
              <CancellationsTab range={range} />
            ) : tab.key === 'debtors' ? (
              <DebtorsTab />
            ) : (
              <StaffTab range={range} />
            ),
        }))}
      />
    </div>
  );
}
