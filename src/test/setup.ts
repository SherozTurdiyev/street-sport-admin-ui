import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw';

/*
 * `findBy*` va `waitFor` uchun standart chegara 1 soniya. Bu testlar
 * butun ilovani ko'taradi va MSW orqali javob kutadi; o'nlab fayl
 * parallel ishlaganda 1 soniya yetmay qoladi va xatolar fayldan faylga
 * ko'chib yuradi.
 *
 * Bu KUTISH muddati, tekshiruv emas: element baribir paydo bo'lishi
 * shart, faqat sabr uzaydi. Haqiqiy xatolik hech qayerda yashirilmaydi —
 * u shunchaki bir necha soniya kechroq xabar beradi.
 */
configure({ asyncUtilTimeout: 5000 });

/**
 * jsdom `matchMedia` ni amalga oshirmaydi, antd ning moslashuvchan
 * panjarasi esa unga tayanadi.
 *
 * Yamoq so'rovga HAQIQIY javob beradi: `(min-width: 768px)` kabi
 * shartlar `window.innerWidth` (jsdom da 1024) bilan solishtiriladi.
 * Ilgari hamma so'rov `false` edi va bu jimgina xato berardi — antd
 * `responsive: ['md']` qo'yilgan ustunni yashirar, test esa uni
 * yo'q deb hisoblardi. Endi testlar ish stoli kengligida ishlaydi.
 */
function mediaMatches(query: string): boolean {
  const min = /\(min-width:\s*(\d+)px\)/.exec(query);
  if (min) return window.innerWidth >= Number(min[1]);
  const max = /\(max-width:\s*(\d+)px\)/.exec(query);
  if (max) return window.innerWidth <= Number(max[1]);
  return false;
}

window.matchMedia ??= ((query: string) => ({
  matches: mediaMatches(query),
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

/**
 * jsdom `ResizeObserver` ni ham amalga oshirmaydi. antd ning `Select`
 * va `Modal` komponentlari o'lchamni kuzatadi, shuning uchun usiz ular
 * umuman chizilmaydi. Kuzatuv testda hech narsaga ta'sir qilmaydi:
 * o'lcham o'zgarmaydi.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

// Kutilmagan so'rov testni yiqitadi: mock qilinmagan endpoint jimgina
// osilib qolgandan ko'ra, darhol ko'rinishi kerak.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
