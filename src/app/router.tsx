import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { useHasOrg } from '@/features/auth/hooks';
import { FullPageSpin } from '@/shared/ui/FullPageSpin';
import { NoSectionsPage } from '@/shared/ui/NoSectionsPage';
import { RedirectIfAuthed } from './guards/RedirectIfAuthed';
import { RequireAuth } from './guards/RequireAuth';
import { RequirePermission } from './guards/RequirePermission';
import { AppLayout } from './layout/AppLayout';

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
const BookingsPage = lazy(() =>
  import('@/features/bookings/BookingsPage').then((m) => ({
    default: m.BookingsPage,
  })),
);
const ShiftsPage = lazy(() =>
  import('@/features/shifts/ShiftsPage').then((m) => ({
    default: m.ShiftsPage,
  })),
);
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({
    default: m.ReportsPage,
  })),
);
const CustomersPage = lazy(() =>
  import('@/features/customers/CustomersPage').then((m) => ({
    default: m.CustomersPage,
  })),
);
const CustomerDetailPage = lazy(() =>
  import('@/features/customers/CustomerDetailPage').then((m) => ({
    default: m.CustomerDetailPage,
  })),
);
const SeriesDetailPage = lazy(() =>
  import('@/features/series/SeriesDetailPage').then((m) => ({
    default: m.SeriesDetailPage,
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
const VenueFormPage = lazy(() =>
  import('@/features/venues/VenueFormPage').then((m) => ({
    default: m.VenueFormPage,
  })),
);
const VenueDetailPage = lazy(() =>
  import('@/features/venues/detail/VenueDetailPage').then((m) => ({
    default: m.VenueDetailPage,
  })),
);
const OrganizationDetailPage = lazy(() =>
  import('@/features/platform/detail/OrganizationDetailPage').then((m) => ({
    default: m.OrganizationDetailPage,
  })),
);
const OrganizationsPage = lazy(() =>
  import('@/features/platform/OrganizationsPage').then((m) => ({
    default: m.OrganizationsPage,
  })),
);
const PlatformVenuesPage = lazy(() =>
  import('@/features/platform/venues/PlatformVenuesPage').then((m) => ({
    default: m.PlatformVenuesPage,
  })),
);
const PlatformVenueDetailPage = lazy(() =>
  import('@/features/platform/venues/PlatformVenueDetailPage').then((m) => ({
    default: m.PlatformVenueDetailPage,
  })),
);

/**
 * Bosh sahifa HAMMA uchun bir xil: `/dashboard`. Panelning MAZMUNI
 * foydalanuvchiga qarab o'zgaradi (`DashboardPage`), manzili emas —
 * shunda bir xodim yuborgan havola boshqasida ham o'sha sahifani
 * ochadi.
 */
function HomeRedirect() {
  return <Navigate to="/dashboard" replace />;
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
              <Route
                path="/platform/organizations/:id"
                element={<OrganizationDetailPage />}
              />
              <Route path="/platform/venues" element={<PlatformVenuesPage />} />
              <Route
                path="/platform/venues/:id"
                element={<PlatformVenueDetailPage />}
              />
            </Route>
            {/* Boshqaruv paneli `RequireOrg` DAN TASHQARIDA: platforma
                xodimining tashkiloti yo'q, lekin uning ham paneli bor. */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route element={<RequireOrg />}>
              <Route path="/bookings" element={<BookingsPage />} />
              <Route
                path="/bookings/series/:id"
                element={<SeriesDetailPage />}
              />
              <Route path="/shifts" element={<ShiftsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/organization" element={<OrganizationPage />} />
              <Route path="/venues" element={<VenuesPage />} />
              {/* `new` YO'LI `:id` DAN OLDIN: aks holda u stadion
                  identifikatori deb o'qilardi. */}
              <Route path="/venues/new" element={<VenueFormPage />} />
              <Route path="/venues/:id" element={<VenueDetailPage />} />
              <Route path="/venues/:id/edit" element={<VenueFormPage />} />
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
