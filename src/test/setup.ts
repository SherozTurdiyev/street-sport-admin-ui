import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw';

/**
 * jsdom `matchMedia` ni amalga oshirmaydi, antd ning moslashuvchan
 * panjarasi esa unga tayanadi. Bu brauzerda mavjud bo'lgan narsaning
 * o'rnini bosuvchi eng kichik yamoq — hech qanday xatti-harakat
 * o'zgarmaydi, chunki testlarda ekran o'lchami tekshirilmaydi.
 */
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

// Kutilmagan so'rov testni yiqitadi: mock qilinmagan endpoint jimgina
// osilib qolgandan ko'ra, darhol ko'rinishi kerak.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
