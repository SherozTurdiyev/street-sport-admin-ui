import { describe, expect, it } from 'vitest';
import { canResetMemberPassword } from './MemberPasswordButton';

describe('canResetMemberPassword', () => {
  it('direktor menejer va administratorni tiklay oladi', () => {
    expect(
      canResetMemberPassword('DIRECTOR', 'MANAGER', 'u-1', 'u-2'),
    ).toBe(true);
    expect(
      canResetMemberPassword('DIRECTOR', 'VENUE_ADMIN', 'u-1', 'u-3'),
    ).toBe(true);
  });

  it('menejer faqat administratorni tiklay oladi', () => {
    expect(
      canResetMemberPassword('MANAGER', 'VENUE_ADMIN', 'u-2', 'u-3'),
    ).toBe(true);
    expect(canResetMemberPassword('MANAGER', 'MANAGER', 'u-2', 'u-4')).toBe(
      false,
    );
  });

  it('o`zini yoki direktorni tiklamaydi', () => {
    expect(
      canResetMemberPassword('DIRECTOR', 'DIRECTOR', 'u-1', 'u-1'),
    ).toBe(false);
    expect(
      canResetMemberPassword('DIRECTOR', 'DIRECTOR', 'u-1', 'u-9'),
    ).toBe(false);
    expect(
      canResetMemberPassword('SUPER_ADMIN', 'MANAGER', 'u-0', 'u-2'),
    ).toBe(false);
  });
});
