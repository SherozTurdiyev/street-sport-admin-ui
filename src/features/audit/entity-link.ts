/**
 * Jurnal obyektning NOMINI bermaydi — backend uni bermaydi, chunki
 * nom uchun 12 xil jadvalga so'rov kerak bo'lardi va o'chirilgan
 * obyektda baribir bo'sh chiqardi (backend spec §3.7).
 *
 * Buning o'rniga turi bo'yicha havola quriladi. `null` — adminkada bu
 * obyektning o'z manzili yo'q: ishlamaydigan havola berishdan ko'ra,
 * identifikatorni ko'chiriladigan matn sifatida ko'rsatgan afzal.
 */
export function entityPath(
  entityType: string,
  entityId: string | null,
): string | null {
  if (entityId === null) return null;

  switch (entityType) {
    case 'venue':
    case 'venue_hours':
    case 'venue_closure':
    case 'venue_photo':
      // Ish vaqti, yopilish va foto — stadionning o'zida ko'rinadi.
      return `/venues/${entityId}`;
    case 'org_member':
    case 'user':
      // Xodim kartochkasi ro'yxat ichidagi oynada ochiladi, o'z
      // manzili yo'q — shuning uchun ro'yxatga olib boriladi.
      return '/members';
    case 'booking_series':
      return `/bookings/series/${entityId}`;
    default:
      // `booking` va `payment`: bron kalendar ichidagi oynada ochiladi.
      return null;
  }
}

/**
 * Boshqa sahifadan jurnalga o'tish uchun manzil.
 *
 * `entityType` ATAYLAB majburiy emas. Stadionning tarixi uchun faqat
 * `entityId` beriladi: stadion sozlamasi, ish vaqti va fotolari uch
 * XIL `entityType` bilan, lekin bir xil `entityId` (stadion o'zi)
 * bilan yoziladi — turini ham qo'shsak, uchtadan faqat bittasi
 * ko'rinardi.
 */
export function auditQuery(filter: {
  actorId?: string;
  entityType?: string;
  entityId?: string;
}): string {
  const params = new URLSearchParams();
  if (filter.actorId !== undefined) params.set('actorId', filter.actorId);
  if (filter.entityType !== undefined) {
    params.set('entityType', filter.entityType);
  }
  if (filter.entityId !== undefined) params.set('entityId', filter.entityId);

  return `/audit?${params.toString()}`;
}
