import type { ComponentType, ReactNode } from 'react';
import { Skeleton, Tooltip, Typography } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { figma } from '@/shared/theme/tokens';

/**
 * Figma: boshqaruv panelidagi ko'rsatkich kartochkasi (2018:6758).
 *
 * Belgi rangi TASHQARIDAN beriladi: bir xil rangdagi to'rtta kartochka
 * bir-biridan farq qilmasdi va ko'z ularni ajrata olmasdi.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  loading = false,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ 'aria-hidden'?: boolean; style?: object }>;
  /** Belgi foni va rangi uchun asos. */
  tint: string;
  loading?: boolean;
  /** Raqam to'liq emasligini aytadigan izoh (masalan, M8 kutilmoqda). */
  hint?: string;
}) {
  return (
    <div
      className="flex items-center gap-4 p-5"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          // Rang shaffoflik bilan beriladi: qattiq to'ldirish quyuq
          // fonda juda ko'zga tashlanardi va raqamni bosib ketardi.
          background: `color-mix(in srgb, ${tint} 20%, transparent)`,
          color: tint,
          fontSize: 20,
        }}
      >
        <Icon aria-hidden />
      </div>

      <div className="min-w-0">
        <div
          className="flex items-center gap-1"
          style={{
            color: figma.textMuted,
            fontSize: 11,
            letterSpacing: '0.5px',
          }}
        >
          <span className="uppercase">{label}</span>
          {hint !== undefined && (
            <Tooltip title={hint}>
              <QuestionCircleOutlined aria-label={`${label} — izoh`} />
            </Tooltip>
          )}
        </div>
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 90 }} />
        ) : (
          <Typography.Text
            strong
            className="block truncate"
            style={{ fontSize: 24, lineHeight: '32px' }}
          >
            {value}
          </Typography.Text>
        )}
      </div>
    </div>
  );
}
