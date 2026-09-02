import { Tooltip } from 'antd';
import { figma } from '@/shared/theme/tokens';
import { formatMoney } from '@/shared/format/money';
import { formatTime } from '@/shared/format/time';
import type { Booking, CalendarVenue } from '../api';
import { buildSlots, type Slot } from '../slots';
import { bookingBlocks, minutesFrom } from './grid';

/** Bir daqiqa necha piksel. 60 daqiqa = 66px — soat yorlig'i sig'adi. */
export const PX_PER_MIN = 1.1;

const CELL: Record<string, { bg: string; border: string; color: string }> = {
  FREE: {
    bg: 'rgba(0, 230, 118, 0.10)',
    border: 'rgba(0, 230, 118, 0.35)',
    color: figma.success,
  },
  CLOSED: {
    bg: 'rgba(251, 44, 54, 0.10)',
    border: 'rgba(251, 44, 54, 0.30)',
    color: figma.danger,
  },
  PAST: { bg: 'transparent', border: figma.border, color: figma.textMuted },
};

function blockLabel(booking: Booking): string {
  return `${formatTime(booking.startsAt)}–${formatTime(booking.endsAt)}`;
}

/**
 * Bitta stadionning ustuni. Ikki qatlam: fon kataklari va bron
 * bloklari — `grid.ts` dagi izohga qarang.
 */
export function VenueColumn({
  venue,
  dayStart,
  weekday,
  axisStart,
  onSlot,
  onBooking,
}: {
  venue: CalendarVenue;
  dayStart: string;
  weekday: number;
  axisStart: number;
  onSlot: (venue: CalendarVenue, slot: Slot) => void;
  onBooking: (booking: Booking) => void;
}) {
  const fon = buildSlots(venue, dayStart, weekday).filter(
    (slot) => slot.booking === null,
  );

  return (
    <div className="relative min-w-40 flex-1">
      {fon.map((slot) => {
        const view = CELL[slot.status] ?? CELL.PAST!;
        const top = minutesFrom(dayStart, slot.startsAt) - axisStart;
        const bosiladi = slot.status === 'FREE';
        return (
          <button
            key={slot.startsAt}
            type="button"
            disabled={!bosiladi}
            aria-label={
              bosiladi
                ? `${venue.name} ${slot.label} — bron qilish`
                : `${venue.name} ${slot.label}`
            }
            onClick={() => onSlot(venue, slot)}
            className="absolute inset-x-1 flex items-start justify-start px-2 py-1 text-left"
            style={{
              top: top * PX_PER_MIN,
              height: venue.slotMinutes * PX_PER_MIN - 2,
              background: view.bg,
              border: `1px dashed ${view.border}`,
              borderRadius: 10,
              color: view.color,
              fontSize: 11,
              cursor: bosiladi ? 'pointer' : 'default',
            }}
          >
            {slot.label}
          </button>
        );
      })}

      {bookingBlocks(venue, dayStart).map(({ booking, top, height }) => (
        <Tooltip key={booking.id} title={formatMoney(booking.priceTotal)}>
          <button
            type="button"
            aria-label={`${blockLabel(booking)} — bronni ochish`}
            onClick={() => onBooking(booking)}
            className="absolute inset-x-1 overflow-hidden px-2 py-1 text-left"
            style={{
              top: (top - axisStart) * PX_PER_MIN,
              height: height * PX_PER_MIN - 2,
              background: figma.primarySoft,
              border: `1px solid ${figma.primarySoftBorder}`,
              borderRadius: 10,
              color: figma.text,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {blockLabel(booking)}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
