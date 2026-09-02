import { Alert, Empty, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import { figma } from '@/shared/theme/tokens';
import type { Booking, CalendarVenue } from '../api';
import type { Slot } from '../slots';
import { useDay } from '../hooks';
import { axisRange, hourTicks } from './grid';
import { PX_PER_MIN, VenueColumn } from './VenueColumn';

/** Dushanba = 1, yakshanba = 7 — backend shunday sanaydi. */
function weekdayOf(date: string): number {
  const d = dayjs(date).day();
  return d === 0 ? 7 : d;
}

function label(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  return `${String(h).padStart(2, '0')}:00`;
}

export function DayCalendar({
  date,
  venueIds,
  onSlot,
  onBooking,
}: {
  date: string;
  venueIds: string[];
  onSlot: (venue: CalendarVenue, slot: Slot) => void;
  onBooking: (booking: Booking) => void;
}) {
  const { data, isPending, error } = useDay(date, venueIds);

  if (error !== null) {
    return <Alert type="error" showIcon message={errorMessage(error)} />;
  }
  if (isPending || !data) return <Skeleton active />;

  const weekday = weekdayOf(date);
  const axis = axisRange(data.venues, weekday);

  if (data.venues.length === 0) {
    return <Empty description="Stadion topilmadi" />;
  }
  if (axis === null) {
    return <Empty description="Bu kuni hamma stadion yopiq" />;
  }

  const height = (axis.end - axis.start) * PX_PER_MIN;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {/* Vaqt o'qi — chapda, ustunlar bilan bir xil balandlikda. */}
        <div className="relative w-14 shrink-0" style={{ height }}>
          {hourTicks(axis).map((m) => (
            <span
              key={m}
              className="absolute right-2"
              style={{
                top: (m - axis.start) * PX_PER_MIN - 8,
                color: figma.textMuted,
                fontSize: 11,
              }}
            >
              {label(m)}
            </span>
          ))}
        </div>

        {data.venues.map((venue) => (
          <div key={venue.venueId} className="min-w-40 flex-1">
            <Typography.Text
              strong
              className="mb-2 block truncate"
              style={{ fontSize: 13 }}
            >
              {venue.name}
            </Typography.Text>
            <div className="relative" style={{ height }}>
              <VenueColumn
                venue={venue}
                dayStart={data.from}
                weekday={weekday}
                axisStart={axis.start}
                onSlot={onSlot}
                onBooking={onBooking}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
