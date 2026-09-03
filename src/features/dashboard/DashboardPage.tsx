import { NoSectionsPage } from '@/shared/ui/NoSectionsPage';
import { useCan, useHasOrg } from '@/features/auth/hooks';
import { OrgDashboard } from './OrgDashboard';
import { PlatformDashboard } from './PlatformDashboard';

/**
 * Manzil hamma uchun BITTA — `/dashboard`. Ochiladigan panel esa
 * foydalanuvchiga qarab boshqacha.
 *
 * Ilgari bosh sahifa menyudagi birinchi ochiq bo'limga yo'naltirardi va
 * platforma xodimi `/platform/organizations` ga tushib qolardi. Manzil
 * shu tariqa hisobga bog'lanib qolgan edi: bir foydalanuvchi yuborgan
 * havola boshqasida ochilmasdi.
 *
 * Qaror ROL bo'yicha emas, ruxsat bo'yicha (TZ 4.4): platforma paneli
 * `platform.org.manage` ga tegishli, u esa hech qaysi tashkilot roliga
 * berilmaydi.
 */
export function DashboardPage() {
  const can = useCan();
  const hasOrg = useHasOrg();

  if (can('platform.org.manage')) return <PlatformDashboard />;
  if (hasOrg) return <OrgDashboard />;

  // Tashkiloti ham, platforma ruxsati ham yo'q hisob: ko'rsatadigan
  // ko'rsatkich yo'q, shuning uchun holat tushuntiriladi.
  return <NoSectionsPage />;
}
