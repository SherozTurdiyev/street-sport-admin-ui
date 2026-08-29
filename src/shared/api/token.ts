/**
 * Access token ATAYLAB `localStorage` da emas, xotirada saqlanadi:
 * `localStorage` ga XSS orqali yetish mumkin, modul o'zgaruvchisiga esa
 * yo'q. Refresh token allaqachon httpOnly cookie'da va JavaScript uni
 * umuman ko'rmaydi.
 *
 * Narxi: sahifa yangilanganda token yo'qoladi. U `POST /auth/refresh`
 * orqali tiklanadi — cookie saqlanib qolgani uchun foydalanuvchi qayta
 * login qilmaydi.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
