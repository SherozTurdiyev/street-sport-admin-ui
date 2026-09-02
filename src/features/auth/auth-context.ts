import { createContext } from 'react';
import type { Me } from './api';

/**
 * Uchinchi holat — `loading` — SHART. Ilova ishga tushganda access token
 * xotirada yo'q va foydalanuvchi kirganmi-yo'qmi bilinmaydi; buni bilish
 * uchun `/auth/refresh` ga borish kerak. Uchinchi holat bo'lmasa login
 * sahifasi bir lahza chaqnab, keyin ichki sahifaga o'tardi.
 */
export type AuthStatus = 'loading' | 'authed' | 'anon';

export type AuthValue = {
  status: AuthStatus;
  me: Me | null;
  /**
   * `remember` — brauzer yopilgandan keyin ham kirgan holda qolish.
   * `false` bo'lsa, ilova keyingi ishga tushishida sessiyani yopadi.
   */
  login: (phone: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  reloadMe: () => Promise<void>;
  /** Serverdan kelgan yangi profilni holatga qo'yadi. */
  applyMe: (next: Me) => void;
};

export const AuthContext = createContext<AuthValue | null>(null);
