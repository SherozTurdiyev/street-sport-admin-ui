import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useCan } from '@/features/auth/hooks';
import { FullPageSpin } from '@/shared/ui/FullPageSpin';
import { RedirectIfAuthed } from './guards/RedirectIfAuthed';
import { RequireAuth } from './guards/RequireAuth';
import { RequirePermission } from './guards/RequirePermission';
import { AppLayout } from './layout/AppLayout';
import { allowedNav } from './layout/nav';

/**
 * Sahifalar talab bo'yicha yuklanadi. Login qilayotgan odamga xodimlar
 * jadvalining kodi kerak emas; kirmagan foydalanuvchi esa ichki
 * sahifalarni umuman ko'rmaydi.
 */
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const ChangePasswordPage = lazy(() =>
  import('@/features/auth/ChangePasswordPage').then((m) => ({
    default: m.ChangePasswordPage,
  })),
);
const MembersPage = lazy(() =>
  import('@/features/members/MembersPage').then((m) => ({
    default: m.MembersPage,
  })),
);
const OrganizationPage = lazy(() =>
  import('@/features/organization/OrganizationPage').then((m) => ({
    default: m.OrganizationPage,
  })),
);

/**
 * Bosh sahifa qat'iy emas: foydalanuvchi o'ziga ochiq BIRINCHI bo'limga
 * tushadi. Aks holda administrator har kirganda "ruxsat yo'q" sahifasini
 * ko'rardi.
 */
function HomeRedirect() {
  const can = useCan();
  const first = allowedNav(can)[0];
  return <Navigate to={first?.path ?? '/organization'} replace />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<FullPageSpin />}>
      <Routes>
        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          {/* Parol almashtirish LAYOUTDAN TASHQARIDA: bu sahifaga
              majburan yuborilgan foydalanuvchi uchun menyu ochilmaydi. */}
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/organization" element={<OrganizationPage />} />
            <Route
              element={<RequirePermission permission="member.admin.manage" />}
            >
              <Route path="/members" element={<MembersPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
