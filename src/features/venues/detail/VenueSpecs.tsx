import { Descriptions } from 'antd';
import { displayPhone } from '@/shared/format/phone';
import { formatDateTime } from '@/shared/format/time';
import { formatMoney } from '@/shared/format/money';
import type { VenueDetail } from '../api';
import { AMENITY_LABELS, SPORT_TYPE_LABELS, SURFACE_LABELS } from '../enums';

/** Figma: "Venue Specifications" (2020:8826) — o'ng ustundagi karta. */
export function VenueSpecs({
  venue,
  basePricePerHour,
}: {
  venue: VenueDetail;
  /** Bazaviy narx qoidalardan keladi, stadion obyektida yo'q. */
  basePricePerHour: string | null;
}) {
  return (
    <Descriptions column={1} size="small">
      <Descriptions.Item label="Sport turi">
        {SPORT_TYPE_LABELS[venue.sportType]}
      </Descriptions.Item>
      <Descriptions.Item label="Bazaviy narx">
        {basePricePerHour === null
          ? 'Belgilanmagan'
          : `${formatMoney(basePricePerHour)}/soat`}
      </Descriptions.Item>
      <Descriptions.Item label="O‘lchami">
        {venue.sizeLabel ?? '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Qoplama">
        {venue.surface === null ? '—' : SURFACE_LABELS[venue.surface]}
      </Descriptions.Item>
      <Descriptions.Item label="Bron qadami">
        {venue.slotMinutes} daqiqa
      </Descriptions.Item>
      <Descriptions.Item label="Aloqa">
        {displayPhone(venue.contactPhone)}
      </Descriptions.Item>
      <Descriptions.Item label="Qulayliklar">
        {venue.amenities.length === 0
          ? '—'
          : venue.amenities.map((a) => AMENITY_LABELS[a]).join(', ')}
      </Descriptions.Item>
      <Descriptions.Item label="Yaratilgan">
        {formatDateTime(venue.createdAt)}
      </Descriptions.Item>
    </Descriptions>
  );
}
