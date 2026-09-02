import dayjs from 'dayjs';
import { Empty, Tag, Typography } from 'antd';
import { BOOKING_STATUS_VIEW, type Booking } from '@/features/bookings/api';
import { formatMoney } from '@/shared/format/money';
import { formatTime } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';

/** Figma: "Venue Bookings" (2020:8683) — vaqt, davomiylik, narx, holat. */
export function DayBookings({ bookings }: { bookings: readonly Booking[] }) {
  if (bookings.length === 0) {
    return <Empty description="Bu kuni bron yo‘q" />;
  }

  const tartibli = [...bookings].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );

  return (
    <div className="flex flex-col">
      {tartibli.map((booking) => {
        const status = BOOKING_STATUS_VIEW[booking.status];
        const daqiqa = dayjs(booking.endsAt).diff(
          dayjs(booking.startsAt),
          'minute',
        );
        return (
          <div
            key={booking.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
            style={{ borderTop: `1px solid ${figma.border}` }}
          >
            <div>
              <Typography.Text strong style={{ fontSize: 15 }}>
                {formatTime(booking.startsAt)} – {formatTime(booking.endsAt)}
              </Typography.Text>
              <span style={{ color: figma.textMuted, fontSize: 12 }}>
                {' '}
                {daqiqa} daq.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Typography.Text strong>
                {formatMoney(booking.priceTotal)}
              </Typography.Text>
              <Tag color={status.color}>{status.label}</Tag>
            </div>
          </div>
        );
      })}
    </div>
  );
}
