/**
 * Bildirishnoma turidan tegishli sahifaga.
 *
 * `null` — bu turning o'z sahifasi yo'q: xabar matni o'zi yetarli va
 * ishlamaydigan havoladan ko'ra hech qanday havola yo'q bo'lgani
 * yaxshi.
 */
export function notificationPath(
  type: string,
  payload: Record<string, unknown> | null,
): string | null {
  const id = (key: string): string | null => {
    const value = payload?.[key];
    return typeof value === 'string' ? value : null;
  };

  switch (type) {
    case 'shift.cash_mismatch':
    case 'shift.left_open':
      // Smenaning o'z manzili yo'q — ro'yxatda ochiladi.
      return '/shifts';
    case 'series.expiring': {
      const seriesId = id('seriesId');
      return seriesId === null ? null : `/bookings/series/${seriesId}`;
    }
    case 'ACCOUNT_LOCKED':
      // Bloklangan hisob xodimlar ro'yxatida ko'rinadi.
      return '/members';
    default:
      return null;
  }
}
