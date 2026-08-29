import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Spin } from 'antd';
import { RequireAuth } from './guards/RequireAuth';

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

function Loading() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/" element={<Navigate to="/members" replace />} />
          <Route
            path="/members"
            element={<div className="p-6">Xodimlar — Task 10</div>}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
