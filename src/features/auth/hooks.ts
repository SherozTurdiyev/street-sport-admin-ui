import { useContext, useMemo } from 'react';
import { AuthContext, type AuthValue } from './auth-context';

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth faqat AuthProvider ichida ishlaydi');
  return value;
}

/**
 * Ruxsat tekshiruvi ROL bo'yicha emas, `permissions` bo'yicha — backenddagi
 * TZ 4.4 qoidasining aynan o'zi. Rol jadvali kelajakda o'zgarishi mumkin,
 * ruxsat nomi esa barqaror.
 */
export function useCan(): (permission: string) => boolean {
  const { me } = useAuth();
  const granted = useMemo(
    () => new Set(me?.permissions ?? []),
    [me?.permissions],
  );
  return useMemo(
    () => (permission: string) => granted.has(permission),
    [granted],
  );
}
