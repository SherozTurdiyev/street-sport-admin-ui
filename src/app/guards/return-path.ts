/**
 * Foydalanuvchi O'ZI bormagan sahifalar. Ular sessiya uzilganda
 * `state.from` ga tushib qolishi mumkin, lekin qaytarish manzili
 * bo'la olmaydi:
 *
 * - `/login` — qaytarilsa cheksiz halqa;
 * - `/change-password` — parol almashgach backend barcha sessiyalarni
 *   yopadi, foydalanuvchi aynan shu sahifada turib chiqib ketadi va
 *   qayta kirganda o'sha yerga tashlanardi, garchi parol allaqachon
 *   almashtirilgan bo'lsa ham.
 */
const NOT_A_DESTINATION: ReadonlySet<string> = new Set([
  '/login',
  '/change-password',
]);

/** Qayerga qaytarish kerakligini hal qiladi; shubha bo'lsa — bosh sahifa. */
export function returnPath(from: string | undefined): string {
  return from !== undefined && !NOT_A_DESTINATION.has(from) ? from : '/';
}
