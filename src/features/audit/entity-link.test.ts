import { describe, expect, it } from 'vitest';
import { auditQuery, entityPath } from './entity-link';

describe('entityPath', () => {
  it('stadion va uning bo`limlari stadion sahifasiga olib boradi', () => {
    expect(entityPath('venue', 'v-1')).toBe('/venues/v-1');
    expect(entityPath('venue_hours', 'v-1')).toBe('/venues/v-1');
    expect(entityPath('venue_closure', 'v-1')).toBe('/venues/v-1');
    expect(entityPath('venue_photo', 'v-1')).toBe('/venues/v-1');
  });

  it('xodim yozuvi xodimlar ro`yxatiga olib boradi', () => {
    expect(entityPath('org_member', 'm-1')).toBe('/members');
    expect(entityPath('user', 'u-1')).toBe('/members');
  });

  it('takroriy bronning o`z sahifasi bor', () => {
    expect(entityPath('booking_series', 's-1')).toBe('/bookings/series/s-1');
  });

  it('bron va to`lovda havola yo`q', () => {
    // Adminkada bitta bronning o'z manzili yo'q — u kalendar ichidagi
    // oynada ochiladi.
    expect(entityPath('booking', 'b-1')).toBeNull();
    expect(entityPath('payment', 'p-1')).toBeNull();
  });

  it('identifikator yo`q bo`lsa havola ham yo`q', () => {
    expect(entityPath('venue', null)).toBeNull();
  });
});

describe('auditQuery', () => {
  it('xodim bo`yicha filtr', () => {
    expect(auditQuery({ actorId: 'u-1' })).toBe('/audit?actorId=u-1');
  });

  it('stadion tarixida obyekt TURI yo`q', () => {
    // Sozlama, ish vaqti va foto uch xil `entityType` bilan, lekin bir
    // xil `entityId` bilan yoziladi — turi qo'shilsa uchtadan faqat
    // bittasi ko'rinardi.
    expect(auditQuery({ entityId: 'v-1' })).toBe('/audit?entityId=v-1');
  });

  it('bron tarixida turi ham beriladi', () => {
    expect(auditQuery({ entityType: 'booking', entityId: 'b-1' })).toBe(
      '/audit?entityType=booking&entityId=b-1',
    );
  });
});
