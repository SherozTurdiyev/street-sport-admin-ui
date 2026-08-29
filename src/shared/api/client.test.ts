import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test/msw';
import { api, refreshOnce } from './client';
import { getAccessToken, setAccessToken } from './token';

const API = 'http://localhost:3001/api/v1';

describe('401 va yagona refresh', () => {
  beforeEach(() => setAccessToken('eski'));

  it('401 dan keyin refresh qilib so`rovni qaytadan yuboradi', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/members`, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ code: 'AUTH_TOKEN_EXPIRED' }, { status: 401 });
        }
        return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 });
      }),
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ accessToken: 'yangi' }),
      ),
    );

    const res = await api.get('/members');
    expect(res.data.total).toBe(0);
    expect(getAccessToken()).toBe('yangi');
    expect(calls).toBe(2);
  });

  it('parallel 401 larda refresh BIR MARTA ketadi', async () => {
    // Eng muhim test: refresh rotatsiyasi tufayli ikkinchi refresh
    // birinchisini yaroqsiz qiladi va foydalanuvchi tizimdan tushadi.
    let refreshCalls = 0;
    let memberCalls = 0;
    server.use(
      http.get(`${API}/members`, () => {
        memberCalls += 1;
        if (memberCalls <= 2) return HttpResponse.json({}, { status: 401 });
        return HttpResponse.json({ ok: true });
      }),
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'yangi' });
      }),
    );

    await Promise.all([api.get('/members'), api.get('/members')]);
    expect(refreshCalls).toBe(1);
  });

  it('refresh ham yiqilsa token tozalanadi', async () => {
    server.use(
      http.get(`${API}/members`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ code: 'AUTH_TOKEN_INVALID' }, { status: 401 }),
      ),
    );

    await expect(api.get('/members')).rejects.toMatchObject({ status: 401 });
    expect(getAccessToken()).toBeNull();
  });

  it('login xatosida refresh urinilmaydi', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { code: 'AUTH_INVALID_CREDENTIALS', message: "Parol noto'g'ri." },
          { status: 401 },
        ),
      ),
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'yangi' });
      }),
    );

    await expect(
      api.post('/auth/login', { phone: '+998901110001', password: 'x' }),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });
    expect(refreshCalls).toBe(0);
  });

  it('xato javob ApiError shaklida qaytadi', async () => {
    server.use(
      http.get(`${API}/venues`, () =>
        HttpResponse.json(
          { code: 'VENUE_ACCESS_DENIED', message: 'Bu stadion sizga biriktirilmagan.' },
          { status: 403 },
        ),
      ),
    );

    await expect(api.get('/venues')).rejects.toEqual({
      code: 'VENUE_ACCESS_DENIED',
      message: 'Bu stadion sizga biriktirilmagan.',
      details: undefined,
      status: 403,
    });
  });

  it('refreshOnce parallel chaqiruvlarda bitta so`rov yuboradi', async () => {
    let calls = 0;
    server.use(
      http.post(`${API}/auth/refresh`, () => {
        calls += 1;
        return HttpResponse.json({ accessToken: 'yangi' });
      }),
    );

    await Promise.all([refreshOnce(), refreshOnce(), refreshOnce()]);
    expect(calls).toBe(1);
  });
});
