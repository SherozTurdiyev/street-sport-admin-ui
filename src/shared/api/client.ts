import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken } from './token';
import { toApiError } from './errors';
import {
  clearSubscriptionExpired,
  markSubscriptionExpired,
} from './subscription';

const BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  // Cookie usiz `/auth/refresh` ishlamaydi: refresh token httpOnly
  // cookie'da yashaydi va uni faqat brauzer yuboradi.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Davom etayotgan refresh HAMMA uchun umumiy.
 *
 * Backend refresh tokenni har chaqiruvda almashtiradi (rotatsiya). Agar
 * har bir 401 o'zi refresh qilsa, ikkinchisi birinchisi yaratgan tokenni
 * yaroqsiz qiladi va foydalanuvchi tizimdan tushib ketadi. Bu xato faqat
 * bir necha so'rov bir vaqtda ketganda, ya'ni tasodifiy chiqadi.
 */
let refreshing: Promise<string> | null = null;

export function refreshOnce(): Promise<string> {
  if (!refreshing) {
    refreshing = axios
      .post<{ accessToken: string }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((r) => {
        setAccessToken(r.data.accessToken);
        return r.data.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

let onAuthLost: () => void = () => {};

/** `AuthProvider` o'rnatadi: sessiya yo'qolganda login sahifasiga o'tish. */
export function setAuthLostHandler(fn: () => void): void {
  onAuthLost = fn;
}

/**
 * Bu ikki yo'l 401 da qayta urinilmaydi. `/auth/login` da 401 — bu
 * "parol xato" degani, refresh yordam bermaydi. `/auth/refresh` da 401
 * esa cheksiz halqa hosil qilardi.
 */
const NO_RETRY = ['/auth/login', '/auth/refresh'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => {
    // `GET` obuna tugaganda ham ishlaydi (faqat o'qish rejimi), shuning
    // uchun u bannerni olib tashlamaydi. Muvaffaqiyatli YOZISH esa
    // obuna yana faolligini isbotlaydi.
    if (
      response.config.method !== undefined &&
      response.config.method !== 'get'
    ) {
      clearSubscriptionExpired();
    }
    return response;
  },
  async (error: unknown) => {
    const err = error as {
      config?: RetriableConfig;
      response?: { status: number };
    };
    const config = err.config;
    const isAuthCall = NO_RETRY.some((path) => config?.url?.includes(path));

    if (
      err.response?.status === 401 &&
      config &&
      !config._retried &&
      !isAuthCall
    ) {
      // Bir marta urinilgani belgilanadi: yangi token bilan ham 401
      // kelsa, cheksiz halqa hosil bo'lmaydi.
      config._retried = true;
      try {
        await refreshOnce();
        return await api.request(config);
      } catch {
        setAccessToken(null);
        onAuthLost();
      }
    }

    const apiError = toApiError(error);
    if (apiError.status === 402) markSubscriptionExpired(apiError.message);

    return Promise.reject(apiError);
  },
);
