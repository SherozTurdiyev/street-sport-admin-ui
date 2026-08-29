import { setupServer } from 'msw/node';

/**
 * Testlar HTTP darajasida javob beradi: ilova haqiqiy axios, haqiqiy
 * react-query va haqiqiy komponentlar bilan ishlaydi. Backendda baza
 * mock qilinmagani kabi, bu yerda ham ilovaning ichki qismlari mock
 * qilinmaydi.
 */
export const server = setupServer();
