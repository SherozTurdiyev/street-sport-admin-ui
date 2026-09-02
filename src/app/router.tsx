import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { useCan, useHasOrg } from '@/features/auth/hooks';
import { FullPageSpin } from '@/shared/ui/FullPageSpin';
import { NoSectionsPage } from '@/shared/ui/NoSectionsPage';
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
const ProfilePage = lazy(() =>
  import('@/features/auth/ProfilePage').then((m) => ({
    default: m.ProfilePage,
  })),
);
const ChangePasswordPage = lazy(() =>
  import('@/features/auth/ChangePasswordPage').then((m) => ({
    default: m.ChangePasswordPage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({
    default: m.DashboardPage,
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
const VenuesPage = lazy(() =>
  import('@/features/venues/VenuesPage').then((m) => ({
    default: m.VenuesPage,
  })),
);
const OrganizationsPage = lazy(() =>
  import('@/features/platform/OrganizationsPage').then((m) => ({
    default: m.OrganizationsPage,
  })),
);

/**
 * Bosh sahifa qat'iy emas: foydalanuvchi o'ziga ochiq BIRINCHI bo'limga
 * tushadi. Aks holda administrator har kirganda "ruxsat yo'q" sahifasini
 * ko'rardi.
 *
 * Birorta bo'lim ochiq bo'lmasa qat'iy manzilga yuborilmaydi: platforma
 * xodimini `/organization` ga tashlash uni ishlamaydigan sahifaga olib
 * borardi.
 */
function HomeRedirect() {
  const can = useCan();
  const hasOrg = useHasOrg();
  const first = allowedNav(can, hasOrg)[0];
  return first ? <Navigate to={first.path} replace /> : <NoSectionsPage />;
}

/** Tashkilot bo'limlari a'zolik talab qiladi — manzil qo'lda yozilsa ham. */
function RequireOrg() {
  return useHasOrg() ? <Outlet /> : <NoSectionsPage />;
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
            {/* Profil `RequireOrg` DAN TASHQARIDA: platforma xodimining
                ham profili bor, tashkiloti esa yo'q. */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              element={<RequirePermission permission="platform.org.manage" />}
            >
              <Route
                path="/platform/organizations"
                element={<OrganizationsPage />}
              />
            </Route>
            <Route element={<RequireOrg />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/organization" element={<OrganizationPage />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route
                element={<RequirePermission permission="member.admin.manage" />}
              >
                <Route path="/members" element={<MembersPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
