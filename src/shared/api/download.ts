import type { AxiosResponse } from 'axios';

/**
 * Faylni oddiy `<a href>` bilan yuklab bo'lmaydi: havola
 * `Authorization` sarlavhasini yubormaydi va backend 401 qaytarardi.
 * Token esa ataylab xotirada (XSS), ya'ni uni URL ga qo'yib ham
 * bo'lmaydi. Shuning uchun javob blob sifatida olinadi va vaqtinchalik
 * havola yasaladi.
 *
 * Fayl nomi backend bergan sarlavhadan olinadi — unda oraliq ham bor.
 * Sarlavha yetib kelmasa (proxy uni kesib tashlashi mumkin) zaxira nom
 * ishlatiladi.
 */
export function downloadBlob(
  response: AxiosResponse<Blob>,
  fallbackName: string,
): void {
  const disposition: unknown = response.headers['content-disposition'];
  let name = fallbackName;
  if (typeof disposition === 'string') {
    const match = /filename="([^"]+)"/.exec(disposition);
    if (match) name = match[1]!;
  }

  const url = URL.createObjectURL(response.data);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    // Ob'ekt havolasi tozalanmasa, fayl brauzer yopilguncha xotirada
    // qolib ketardi.
    URL.revokeObjectURL(url);
  }
}
