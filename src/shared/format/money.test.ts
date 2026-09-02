import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('uch xonadan ajratadi', () => {
    expect(formatMoney('1234567')).toBe("1 234 567 so'm");
  });

  it('katta summani ANIQ ko`rsatadi', () => {
    // 2^53 dan katta: `Number` orqali o'tkazilsa oxirgi raqamlar
    // o'zgarib ketardi.
    expect(formatMoney('9007199254740993')).toBe("9 007 199 254 740 993 so'm");
  });

  it('bo`sh qiymatni chiziqcha bilan almashtiradi', () => {
    expect(formatMoney(null)).toBe('—');
  });
});
