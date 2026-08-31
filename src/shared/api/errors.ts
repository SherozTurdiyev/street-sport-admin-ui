export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  /** Tarmoq uzilganda 0. */
  status: number;
};

const UNKNOWN =
  "Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";

/**
 * Frontend xato MATNINI o'ylab topmaydi: backend `message` ni o'zbek
 * tilida, foydalanuvchiga ko'rsatishga tayyor holda qaytaradi. Aks holda
 * bitta holat uchun ikki joyda ikki xil matn bo'lardi va ular vaqt o'tishi
 * bilan bir-biridan uzoqlashardi.
 *
 * Yagona istisno — javob umuman kelmagan holat: u yerda backend hech
 * narsa aytmagan.
 */
export function toApiError(error: unknown): ApiError {
  const e = error as {
    response?: { status: number; data?: Partial<ApiError> };
    request?: unknown;
  };

  if (e.response) {
    const data = e.response.data ?? {};
    return {
      code: data.code ?? 'INTERNAL',
      message: data.message ?? UNKNOWN,
      details: data.details,
      status: e.response.status,
    };
  }

  if (e.request) {
    return {
      code: 'NETWORK_ERROR',
      message: "Server bilan aloqa yo'q. Internet ulanishini tekshiring.",
      status: 0,
    };
  }

  return { code: 'INTERNAL', message: UNKNOWN, status: 0 };
}

export function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    'message' in e &&
    'status' in e
  );
}
