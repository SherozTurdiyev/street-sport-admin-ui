import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { Link } from 'react-router';
import { figma } from '@/shared/theme/tokens';
import { ROUND_BUTTON } from '@/features/venues/card-style';

/**
 * Platforma kartochkasidagi yagona amal — ochish.
 *
 * Manzil `/venues/:id` EMAS: u tashkilot ichidagi sahifa va platforma
 * xodimiga yopiq (BR-08/BR-09). Platformaning o'z sahifasi faqat
 * o'qish uchun.
 */
export function PlatformVenueLink({
  venue,
}: {
  venue: { id: string; name: string };
}) {
  return (
    <Tooltip title="Ochish">
      <Link to={`/platform/venues/${venue.id}`}>
        <Button
          aria-label={`${venue.name} — ochish`}
          icon={<ArrowRightOutlined aria-hidden />}
          style={{
            ...ROUND_BUTTON,
            background: figma.primarySoft,
            borderColor: figma.primarySoftBorder,
          }}
        />
      </Link>
    </Tooltip>
  );
}
