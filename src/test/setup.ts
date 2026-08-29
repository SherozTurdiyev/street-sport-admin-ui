import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw';

// Kutilmagan so'rov testni yiqitadi: mock qilinmagan endpoint jimgina
// osilib qolgandan ko'ra, darhol ko'rinishi kerak.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
