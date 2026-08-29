import { Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/hooks';

const CHANGE_PASSWORD = '/change-password';

export function RequireAuth() {
  const { status, me } = useAuth();
  const location = useLocation();

  // Uchinchi holat shu yerda kerak bo'ladi: `loading` paytida login
  // sahifasiga yubormaslik kerak, aks holda sahifa har yangilanganda
  // login bir lahza chaqnab o'tardi.
  if (status === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (status === 'anon') {
    // Qayerga bormoqchi bo'lgani eslab qolinadi — kirgach o'sha yerga
    // qaytariladi.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Backend `mustChangePassword` da boshqa hamma endpointga 403 qaytaradi.
  // Frontend ham shunga mos: bu foydalanuvchi uchun yagona ochiq sahifa —
  // parol almashtirish.
  if (me?.mustChangePassword && location.pathname !== CHANGE_PASSWORD) {
    return <Navigate to={CHANGE_PASSWORD} replace />;
  }

  return <Outlet />;
}
