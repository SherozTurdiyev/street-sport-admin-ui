import type { FormInstance } from 'antd';
import { isApiError, type ApiError } from './errors';

/**
 * Backend `VALIDATION_FAILED` da `details.message` ichida matnlar
 * massivini qaytaradi, masalan `["fullName must be longer than..."]`.
 * Matn maydon nomidan boshlanadi, shuning uchun mos maydonni topish
 * mumkin.
 *
 * Topilmasa `false` qaytadi va chaqiruvchi xabarni umumiy joyda
 * ko'rsatadi — foydalanuvchi hech bo'lmasa nima xato ekanini biladi.
 */
export function applyServerErrors(
  form: FormInstance,
  error: unknown,
  fields: readonly string[],
): boolean {
  if (!isApiError(error) || error.code !== 'VALIDATION_FAILED') return false;

  const details = error.details as { message?: unknown } | undefined;
  const messages = Array.isArray(details?.message)
    ? (details.message as unknown[]).filter(
        (m): m is string => typeof m === 'string',
      )
    : [];
  if (messages.length === 0) return false;

  const byField = new Map<string, string[]>();
  for (const text of messages) {
    const field = fields.find((f) => text.startsWith(f));
    if (!field) continue;
    byField.set(field, [...(byField.get(field) ?? []), text]);
  }
  if (byField.size === 0) return false;

  form.setFields(
    [...byField].map(([name, errors]) => ({ name, errors })),
  );
  return true;
}

/** Xabar matni har doim backenddan keladi — bu yerda hech narsa yozilmaydi. */
export function errorMessage(error: unknown): string {
  return isApiError(error)
    ? error.message
    : "Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
}

export function errorCode(error: unknown): string | null {
  return isApiError(error) ? (error as ApiError).code : null;
}
