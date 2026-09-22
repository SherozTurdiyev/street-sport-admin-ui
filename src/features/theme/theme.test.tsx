import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { AppRouter } from '@/app/router';

const rejim = () => document.documentElement.dataset.theme;

describe('Interfeys rejimi', () => {
  beforeEach(() => {
    server.use(
      // `/profile` qo'shimcha so'rov yubormaydi — boshqaruv paneli esa
      // hisobot so'raydi va u bu testga aloqasiz shovqin qo'shardi.
      ...authedHandlers({ ...DIRECTOR_ME, uiTheme: 'DARK' }),
    );
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('localStorage bo‘sh bo‘lsa qorong‘i ochiladi', async () => {
    renderApp(<AppRouter />, { route: '/profile' });
    await screen.findByRole('button', { name: 'Yorug‘ rejimga o‘tish' });
    expect(rejim()).toBe('dark');
  });

  it('tugma rejimni almashtiradi, saqlaydi va serverga yuboradi', async () => {
    let yuborilgan: unknown = null;
    server.use(
      http.patch(`${API}/auth/me`, async ({ request }) => {
        yuborilgan = await request.json();
        return HttpResponse.json({ ...DIRECTOR_ME, uiTheme: 'LIGHT' });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/profile' });

    await user.click(
      await screen.findByRole('button', { name: 'Yorug‘ rejimga o‘tish' }),
    );

    expect(rejim()).toBe('light');
    expect(localStorage.getItem('ss-mavzu')).toBe('LIGHT');
    await expect.poll(() => yuborilgan).toEqual({ uiTheme: 'LIGHT' });
    // Endi tugma teskari amalni taklif qiladi.
    expect(
      await screen.findByRole('button', { name: 'Qorong‘i rejimga o‘tish' }),
    ).toBeInTheDocument();
  });

  it('serverdagi qiymat localStorage’dan ustun', async () => {
    localStorage.setItem('ss-mavzu', 'DARK');
    server.use(...authedHandlers({ ...DIRECTOR_ME, uiTheme: 'LIGHT' }));
    renderApp(<AppRouter />, { route: '/profile' });

    await screen.findByRole('button', { name: 'Qorong‘i rejimga o‘tish' });
    expect(rejim()).toBe('light');
    expect(localStorage.getItem('ss-mavzu')).toBe('LIGHT');
  });

  it('saqlash xatosida rejim joyida qoladi va xabar chiqadi', async () => {
    server.use(http.patch(`${API}/auth/me`, () => HttpResponse.error()));
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/profile' });

    await user.click(
      await screen.findByRole('button', { name: 'Yorug‘ rejimga o‘tish' }),
    );

    expect(
      await screen.findByText('Rejim saqlanmadi — bu qurilmada ishlaydi'),
    ).toBeInTheDocument();
    // Orqaga qaytarish foydalanuvchi ko'zi oldida ikkinchi marta rang
    // almashtirardi — ataylab qilinmaydi.
    expect(rejim()).toBe('light');
  });

  it('profildagi tanlov “Tizim”ni ham yuboradi', async () => {
    let yuborilgan: unknown = null;
    server.use(
      http.patch(`${API}/auth/me`, async ({ request }) => {
        yuborilgan = await request.json();
        return HttpResponse.json({ ...DIRECTOR_ME, uiTheme: 'SYSTEM' });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/profile' });

    // antd `Segmented` da radio inputining o'zi `pointer-events: none`
    // — odam ham, test ham yorliqni bosadi.
    await user.click(await screen.findByText('Tizim'));
    await expect.poll(() => yuborilgan).toEqual({ uiTheme: 'SYSTEM' });
  });

  it('“Tizim” tanlansa brauzer sozlamasiga ergashadi', async () => {
    // jsdom da `prefers-color-scheme` doim `false` (`src/test/setup.ts`),
    // shuning uchun so'rov shu testda aniq javob beradi.
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (q: string) =>
        ({
          matches: q.includes('prefers-color-scheme: dark'),
          media: q,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    localStorage.setItem('ss-mavzu', 'SYSTEM');
    server.use(...authedHandlers({ ...DIRECTOR_ME, uiTheme: 'SYSTEM' }));

    renderApp(<AppRouter />, { route: '/profile' });
    await screen.findByRole('button', { name: 'Yorug‘ rejimga o‘tish' });
    expect(rejim()).toBe('dark');
  });
});
