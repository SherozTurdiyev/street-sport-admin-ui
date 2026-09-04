import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Alert, Skeleton, Typography } from 'antd';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { figma } from '@/shared/theme/tokens';
import type { RevenueBlock } from '../api';
import { useSummary } from '../hooks';

/**
 * O'sish belgisi. `growthPercent === null` bo'lganda foiz UMUMAN
 * chizilmaydi: backend uni noldan o'sish hisoblanmagani uchun `null`
 * qaytaradi, adminka esa "+100%" deb to'ldirsa, o'sha yolg'on qaytib
 * kelardi.
 */
export function Growth({ block }: { block: RevenueBlock }) {
  if (block.growthPercent === null) {
    return (
      <span style={{ color: figma.textMuted, fontSize: 12 }}>
        Solishtirish uchun ma’lumot yo‘q
      </span>
    );
  }

  const osdi = block.growthPercent >= 0;
  const Belgi = osdi ? ArrowUpOutlined : ArrowDownOutlined;
  return (
    <span
      style={{
        color: osdi ? figma.success : figma.danger,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <Belgi aria-hidden /> {Math.abs(block.growthPercent)}%
      <span style={{ color: figma.textMuted, fontWeight: 400 }}>
        {' '}
        (oldingi davr: {formatMoney(block.previous)})
      </span>
    </span>
  );
}

function DavrCard({ label, block }: { label: string; block: RevenueBlock }) {
  return (
    <div
      className="flex flex-col gap-2 p-4 sm:p-5"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
      }}
    >
      <span style={{ color: figma.textMuted, fontSize: 12 }}>
        <DollarOutlined aria-hidden /> {label}
      </span>
      <Typography.Text strong style={{ fontSize: 24 }}>
        {formatMoney(block.revenue)}
      </Typography.Text>
      <Growth block={block} />
    </div>
  );
}

/**
 * F10.1 — bugun, hafta va oy tushumi.
 *
 * Davrlar QAT'IY: backend bu endpointda sana oralig'ini qabul
 * qilmaydi, shuning uchun bu tabda tanlagich ham o'chirilgan.
 */
export function SummaryTab({ venueIds }: { venueIds?: string[] }) {
  const { data, isPending, error } = useSummary({ venueIds });

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      <DavrCard label="BUGUN" block={data.today} />
      <DavrCard label="SHU HAFTA" block={data.week} />
      <DavrCard label="SHU OY" block={data.month} />
    </div>
  );
}
