import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { refreshOnce, setAuthLostHandler } from '@/shared/api/client';
import { setAccessToken } from '@/shared/api/token';
import { authApi, type Me } from './api';
import {
  clearRemember,
  markAlive,
  rememberChoice,
  shouldForget,
} from './remember';
import { AuthContext, type AuthStatus, type AuthValue } from './auth-context';

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [me, setMe] = useState<Me | null>(null);

  const forgetSession = useCallback(() => {
    setAccessToken(null);
    setMe(null);
    setStatus('anon');
  }, []);

  // Interceptor refresh ham yiqilganda shu yerga xabar beradi.
  useEffect(() => {
    setAuthLostHandler(forgetSession);
  }, [forgetSession]);

  // Sahifa yangilanganda access token yo'qoladi, refresh cookie esa
  // qoladi. Shuning uchun ilova har ishga tushganda avval refresh
  // qilinadi — foydalanuvchi qayta login qilmaydi.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      /*
       * "Eslab qolish" belgilanmagan va brauzer yopilib qayta ochilgan:
       * cookie hali tirik, lekin foydalanuvchi aynan buni istamagan.
       * Uni JavaScript o'chira olmaydi (`httpOnly`) — serverga aytamiz.
       */
      if (shouldForget()) {
        try {
          await authApi.logout();
        } catch {
          // Server yetib bormasa ham foydalanuvchi kirgan holda
          // ko'rsatilmaydi: quyida `anon` ga tushadi.
        }
        clearRemember();
        if (!cancelled) forgetSession();
        return;
      }
      markAlive();

      try {
        await refreshOnce();
        const data = await authApi.me();
        if (!cancelled) {
          setMe(data);
          setStatus('authed');
        }
      } catch {
        if (!cancelled) forgetSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forgetSession]);

  const login = useCallback(
    async (phone: string, password: string, remember: boolean) => {
      rememberChoice(remember);
      const res = await authApi.login(phone, password);
      setAccessToken(res.accessToken);
      // `/auth/me` alohida chaqiriladi: login javobida `permissions` yo'q,
      // butun interfeys esa aynan shunga tayanadi.
      const data = await authApi.me();
      setMe(data);
      setStatus('authed');
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Xato yuqoriga chiqarilmaydi: foydalanuvchi uchun qiladigan ish
      // yo'q va "chiqishda xato" degan xabar faqat chalg'itadi.
      //
      // MA'LUM CHEKLOV: so'rov serverga yetmasa refresh cookie tirik
      // qoladi va sahifa yangilanganda `refreshOnce()` foydalanuvchini
      // jimgina qaytarib kiritadi. Cookie `httpOnly` bo'lgani uchun uni
      // JavaScript o'chira olmaydi — yagona yechim serverga yetkazish.
      // Bu tarmoq uzilgan yoki server yiqilgan holatda sodir bo'ladi;
      // o'sha paytda foydalanuvchi baribir hech nima qila olmaydi.
    } finally {
      clearRemember();
      forgetSession();
    }
  }, [forgetSession]);

  const reloadMe = useCallback(async () => {
    setMe(await authApi.me());
  }, []);

  /**
   * `PATCH /auth/me` javobi `GET /auth/me` bilan bir xil, shuning uchun
   * qo'shimcha so'rov kerak emas — holat to'g'ridan-to'g'ri almashadi.
   */
  const applyMe = useCallback((next: Me) => {
    setMe(next);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ status, me, login, logout, reloadMe, applyMe }),
    [status, me, login, logout, reloadMe, applyMe],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
