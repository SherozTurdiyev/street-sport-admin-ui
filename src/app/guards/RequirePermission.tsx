import { Outlet } from 'react-router';
import { useCan } from '@/features/auth/hooks';
import { ForbiddenPage } from '@/shared/ui/ForbiddenPage';

/**
 * Menyudan yashirish yetarli emas: manzilni qo'lda yozib kirish mumkin.
 * Bu — klient tomondagi qulaylik, himoya emas; haqiqiy to'siq backendda
 * (`PermissionsGuard`).
 */
export function RequirePermission({ permission }: { permission: string }) {
  const can = useCan();
  return can(permission) ? <Outlet /> : <ForbiddenPage />;
}
