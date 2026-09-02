import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/hooks';
import { FullPageSpin } from '@/shared/ui/FullPageSpin';
import { returnPath } from './return-path';

/**
 * Login sahifasi kirgan foydalanuvchiga ko'rsatilmaydi.
 *
 * Yo'naltirish ATAYLAB shu yerda, `LoginPage` ichida emas: u faqat
 * "endigina kirdim" holatini emas, "allaqachon kirganman, lekin
 * `/login` ni ochdim" holatini ham qamrab oladi. Ikki joyda ikki xil
 * qoida bo'lsa, ular vaqt o'tishi bilan farq qila boshlaydi.
 */
export function RedirectIfAuthed() {
  const { status } = useAuth();
  const location = useLocation();

  // `loading` da forma ko'rsatilmaydi: cookie yaroqli bo'lsa, u bir
  // lahza chaqnab, keyin yo'qolardi.
  if (status === 'loading') return <FullPageSpin />;

  if (status === 'authed') {
    // `RequireAuth` qayerga bormoqchi bo'lganini shu yerda qoldiradi.
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={returnPath(from)} replace />;
  }

  return <Outlet />;
}
