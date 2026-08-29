import { describe, expect, it } from 'vitest';
import { isApiError, toApiError } from './errors';

describe('API xatosini o`girish', () => {
  it('backend javobini o`zgarishsiz oladi', () => {
    const e = toApiError({
      response: {
        status: 409,
        data: { code: 'PHONE_TAKEN', message: "Bu raqam ro'yxatdan o'tgan." },
      },
    });
    expect(e).toEqual({
      code: 'PHONE_TAKEN',
      message: "Bu raqam ro'yxatdan o'tgan.",
      details: undefined,
      status: 409,
    });
  });

  it('`details` ni saqlaydi — forma maydonlariga o`sha yerdan tushadi', () => {
    const e = toApiError({
      response: {
        status: 400,
        data: {
          code: 'VALIDATION_FAILED',
          message: "Kiritilgan ma'lumotlarda xatolik bor.",
          details: { message: ['fullName kalta'] },
        },
      },
    });
    expect(e.details).toEqual({ message: ['fullName kalta'] });
  });

  it('tarmoq uzilganda o`zi xabar beradi', () => {
    const e = toApiError({ request: {} });
    expect(e.code).toBe('NETWORK_ERROR');
    expect(e.status).toBe(0);
    expect(e.message).toContain('aloqa');
  });

  it('kutilmagan shakl ham xatoga aylanadi', () => {
    const e = toApiError(new Error('boom'));
    expect(e.code).toBe('INTERNAL');
    expect(e.status).toBe(0);
  });

  it('isApiError faqat to`liq shaklga ha deydi', () => {
    expect(isApiError({ code: 'X', message: 'y', status: 400 })).toBe(true);
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});
