import { figma } from '@/shared/theme/tokens';

/**
 * Ulush ustunchasi — diagramma kutubxonasi o'rniga (spec §2.1).
 * Uchta hisobotda qayta ishlatiladi, shuning uchun alohida.
 *
 * Raqam YONIDA turadi, ustuncha ichida emas: tor ekranda ustuncha
 * qisqarib ketadi va ichidagi matn o'qilmay qoladi.
 */
export function ShareBar({
  percent,
  tone = 'normal',
  label,
}: {
  percent: number;
  /** `warning` — nazorat talab qiladigan qiymat (masalan naqd ulushi). */
  tone?: 'normal' | 'warning' | 'muted';
  /** O'ng tomondagi matn. Berilmasa foizning o'zi chiziladi. */
  label?: string;
}) {
  // `primary` quyuq fonda deyarli ko'rinmaydi — `primaryBright` aynan
  // shu holat uchun mavzuga qo'shilgan.
  const rang =
    tone === 'warning'
      ? figma.warning
      : tone === 'muted'
        ? figma.textMuted
        : figma.primaryBright;

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 min-w-16 flex-1 overflow-hidden"
        style={{ background: figma.border, borderRadius: 999 }}
      >
        <div
          style={{
            // 100 dan oshgan qiymat ustunchani chiqarib yubormasin.
            width: `${Math.min(100, Math.max(0, percent))}%`,
            height: '100%',
            background: rang,
            borderRadius: 999,
          }}
        />
      </div>
      <span
        className="shrink-0 tabular-nums"
        style={{ color: tone === 'muted' ? figma.textMuted : undefined }}
      >
        {label ?? `${percent}%`}
      </span>
    </div>
  );
}
