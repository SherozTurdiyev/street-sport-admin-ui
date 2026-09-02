import { Breadcrumb } from 'antd';
import { Link, useLocation, useMatch } from 'react-router';
import { useCan, useHasOrg } from '@/features/auth/hooks';
import { useVenue } from '@/features/venues/hooks';
import { allowedNav } from './nav';

/**
 * Yo'lakcha SARLAVHADA turadi, sahifa ichida emas: u navigatsiya
 * elementi va barcha sahifalarda bir joyda bo'lishi kerak. Har bir
 * sahifa o'zi chizsa, joylashuvi va uslubi asta-sekin farq qila
 * boshlardi.
 *
 * Ichki sahifaning nomi (masalan, stadion nomi) manzilda yo'q, uni
 * serverdan olish kerak. Shuning uchun bu yerda so'rov yuboriladi —
 * lekin YANGI so'rov emas: sahifaning o'zi aynan shu kalitni so'raydi
 * va react-query ikkalasiga bitta javob beradi.
 */
export function Breadcrumbs() {
  const can = useCan();
  const hasOrg = useHasOrg();
  const location = useLocation();

  /*
   * Ichki sahifalar shu yerda ro'yxatlanadi. Yangi bo'lim
   * qo'shilganda (bron, mijoz) unga ham shunday bitta qator kerak —
   * `useMatch` va nomni beruvchi so'rov.
   */
  const venueMatch = useMatch('/venues/:id');
  const venue = useVenue(venueMatch?.params.id ?? null);

  const section = allowedNav(can, hasOrg).find((item) =>
    location.pathname.startsWith(item.path),
  );
  if (!section) return null;

  const leaf = venueMatch ? (venue.data?.name ?? '…') : null;

  return (
    <Breadcrumb
      items={[
        {
          // Bo'lim sahifasida yo'lakcha oxirgi bo'g'in — havola qilinmaydi.
          title:
            leaf === null ? (
              section.label
            ) : (
              <Link to={section.path}>{section.label}</Link>
            ),
        },
        ...(leaf === null ? [] : [{ title: leaf }]),
      ]}
    />
  );
}
