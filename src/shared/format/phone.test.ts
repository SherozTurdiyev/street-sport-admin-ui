import { describe, expect, it } from 'vitest';
import { displayPhone, formatPhone, phoneDigits, phoneValue } from './phone';

describe('Telefon formati', () => {
  it('to`liq bo`lmagan raqamni ham chizadi', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone('9')).toBe('+998 (9');
    expect(formatPhone('90')).toBe('+998 (90');
    expect(formatPhone('901')).toBe('+998 (90) 1');
    expect(formatPhone('901234567')).toBe('+998 (90) 123-45-67');
  });

  it('mamlakat kodini bir marta olib tashlaydi', () => {
    expect(phoneDigits('+998 (99) 812-34-56')).toBe('998123456');
    expect(phoneDigits('901234567')).toBe('901234567');
    expect(phoneDigits('+998901234567')).toBe('901234567');
  });

  it('forma qiymati bo`sh joysiz bo`ladi', () => {
    expect(phoneValue('+998 (90) 123-45-67')).toBe('+998901234567');
    expect(phoneValue('')).toBe('');
  });

  it('ko`rsatishda faqat o`zbek raqamiga maska kiyintiradi', () => {
    expect(displayPhone('+998901110001')).toBe('+998 (90) 111-00-01');
    expect(displayPhone(null)).toBe('—');
    // Chet el raqami buzilmasligi kerak.
    expect(displayPhone('+7 495 123-45-67')).toBe('+7 495 123-45-67');
  });
});
