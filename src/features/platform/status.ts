import type { EffectiveStatus } from './api';

/**
 * Holat ko'rinishi BITTA joyda. Ro'yxat, kartochka va filtr bir xil
 * so'zni va bir xil rangni ishlatadi — aks holda "To'xtatilgan" va
 * "Bloklangan" bir hodisa uchun ikki xil nom bo'lib qolardi.
 */
export const STATUS_VIEW: Record<
  EffectiveStatus,
  { label: string; color: string }
> = {
  ACTIVE: { label: 'Faol', color: 'success' },
  EXPIRED: { label: 'Muddati tugagan', color: 'warning' },
  SUSPENDED: { label: 'Bloklangan', color: 'error' },
};

export const STATUS_OPTIONS = (
  Object.keys(STATUS_VIEW) as EffectiveStatus[]
).map((value) => ({ value, label: STATUS_VIEW[value].label }));
