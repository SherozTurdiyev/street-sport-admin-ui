import { DEMO_REQUEST_STATUSES, type DemoRequestStatus } from './api';

/**
 * Holat ko'rinishi BITTA joyda — ro'yxat, filtr va oyna bir xil so'zni
 * ishlatadi.
 *
 * `NEW` ataylab binafsha (brend rangi): u "ish kutmoqda" degani va
 * ko'zga birinchi tashlanishi kerak. Qizil ishlatilmadi — qizil bu
 * yerda xato yoki xavf ma'nosini berardi.
 */
export const STATUS_VIEW: Record<
  DemoRequestStatus,
  { label: string; color: string }
> = {
  NEW: { label: 'Yangi', color: 'purple' },
  CONTACTED: { label: 'Bog‘lanildi', color: 'gold' },
  CONVERTED: { label: 'Tashkilot ochildi', color: 'success' },
  REJECTED: { label: 'Rad etildi', color: 'default' },
};

export const STATUS_OPTIONS = DEMO_REQUEST_STATUSES.map((value) => ({
  value,
  label: STATUS_VIEW[value].label,
}));
