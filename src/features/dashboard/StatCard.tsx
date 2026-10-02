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
  compact = false,
  hint,
  footer,
}: {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ 'aria-hidden'?: boolean; style?: object }>;
  /** Belgi foni va rangi uchun asos. */
  tint: string;
  loading?: boolean;
  /**
   * Tor ustunda turadigan kartochka: belgi va ichki bo'shliq kichrayadi.
   * Beshta kartochka bir qatorga sig'ishi kerak bo'lganda yoqiladi.
   */
  compact?: boolean;
  /** Raqam to'liq emasligini aytadigan izoh (masalan, M8 kutilmoqda). */
  hint?: string;
  /**
   * Raqam OSTIDAGI kichik qator: o'sish foizi, havola. Raqamning o'ziga
   * qo'shilsa, u `truncate` ichiga tushib kesilib qolardi.
   */
  footer?: ReactNode;
}) {
  return (
    <div
      className={
        compact
          ? 'flex items-center gap-3 p-4'
          : 'flex items-center gap-3 p-4 sm:gap-4 sm:p-5'
      }
      style={{
        background: figma.bgCardSoft,
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
        // Raqam kartochkaning O'Z kengligiga qarab kichrayadi. Ekran
        // kengligi (`vw`) bu yerda yaramaydi: besh ustunli qatorda
        // kartochka tor bo'ladi-yu, ekran keng bo'lib qolaveradi.
        ...(compact ? { containerType: 'inline-size' } : {}),
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: compact ? 40 : 48,
          height: compact ? 40 : 48,
          borderRadius: compact ? 13 : 16,
          // Rang shaffoflik bilan beriladi: qattiq to'ldirish quyuq
          // fonda juda ko'zga tashlanardi va raqamni bosib ketardi.
          background: `color-mix(in srgb, ${tint} 20%, transparent)`,
          color: tint,
          fontSize: compact ? 17 : 20,
        }}
      >
        <Icon aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
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
            // Raqam ekranga qarab kichrayadi: telefonda 24px da uzun
            // summa ("1 250 000 so'm") kartochkadan chiqib ketardi.
            style={{
              fontSize: compact
                ? 'clamp(14px, calc(14cqw - 10px), 22px)'
                : 'clamp(18px, 4.5vw, 24px)',
              lineHeight: 1.35,
            }}
          >
            {value}
          </Typography.Text>
        )}
        {!loading && footer !== undefined && (
          <div style={{ fontSize: 12, marginTop: 2 }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
