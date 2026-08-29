import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './guards/RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';

/**
 * Layout va ruxsatli menyu Task 8 da qo'shiladi. Hozircha marshrutlar
 * ilova haqiqatan ishga tushishi va login oqimini qo'lda sinash mumkin
 * bo'lishi uchun ulanadi.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/" element={<Navigate to="/members" replace />} />
        <Route path="/members" element={<div className="p-6">Xodimlar — Task 10</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
