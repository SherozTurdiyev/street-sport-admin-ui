import { useSyncExternalStore } from 'react';

/**
 * Tor ekran uchun so'rov ATAYLAB `max-width` bo'yicha yozilgan.
 *
 * `min-width` bilan yozilsa, `matchMedia` mavjud bo'lmagan muhitda
 * (jsdom, server) natija `false` chiqib, keng ekran mobil deb
 * hisoblanardi. `max-width` da esa noaniq holat KENG ekranga tushadi —
 * ya'ni jadval, ro'yxatning to'liq ko'rinishi.
 */
const NARROW = '(max-width: 767px)';

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    // Serverda oyna yo'q: keng ekran deb hisoblanadi.
    () => false,
  );
}
