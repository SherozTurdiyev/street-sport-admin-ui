import { describe, expect, it } from 'vitest';
import { notificationPath } from './notification-link';

describe('notificationPath', () => {
  it('smena xabarlari smenalar ro`yxatiga olib boradi', () => {
    expect(notificationPath('shift.cash_mismatch', { shiftId: 's-1' })).toBe(
      '/shifts',
    );
    expect(notificationPath('shift.left_open', { shiftId: 's-1' })).toBe(
      '/shifts',
    );
  });

  it('seriya eslatmasi seriya sahifasini ochadi', () => {
    expect(notificationPath('series.expiring', { seriesId: 'x-1' })).toBe(
      '/bookings/series/x-1',
    );
  });

  it('seriya identifikatori bo`lmasa havola ham yo`q', () => {
    // Eski yozuvda `payload` boshqacha bo'lishi mumkin — havola
    // o'ylab topilmaydi.
    expect(notificationPath('series.expiring', {})).toBeNull();
    expect(notificationPath('series.expiring', null)).toBeNull();
  });

  it('bloklangan hisob xodimlar ro`yxatiga olib boradi', () => {
    expect(notificationPath('ACCOUNT_LOCKED', { userId: 'u-1' })).toBe(
      '/members',
    );
  });

  it('notanish tur havolasiz qoladi', () => {
    expect(notificationPath('kelajak.turi', { a: 1 })).toBeNull();
  });
});
