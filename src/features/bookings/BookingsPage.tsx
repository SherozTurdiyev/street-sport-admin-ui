import { useState } from 'react';
import { Card } from 'antd';
import { useSearchParams } from 'react-router';
import { BookingFormModal, type SelectedSlot } from './BookingFormModal';
import { tashkentToday } from '@/shared/format/time';
import { CalendarToolbar } from './calendar/CalendarToolbar';
import { DayCalendar } from './calendar/DayCalendar';

/**
 * Kalendar — administratorning kunlik ish joyi. Sana va stadion filtri
 * komponenta holatida, ochilgan bron esa MANZILDA (`?booking=`):
 * kartochka havolasini yuborish mumkin bo'lishi kerak.
 */
export function BookingsPage() {
  const [date, setDate] = useState(tashkentToday);
  const [venueIds, setVenueIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<SelectedSlot | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Card title="Bronlar">
      <CalendarToolbar
        date={date}
        onDate={setDate}
        venueIds={venueIds}
        onVenueIds={setVenueIds}
      />

      <DayCalendar
        date={date}
        venueIds={venueIds}
        onSlot={(venue, slot) => setSelected({ venue, slot })}
        onBooking={(booking) => {
          const next = new URLSearchParams(searchParams);
          next.set('booking', booking.id);
          setSearchParams(next, { replace: true });
        }}
      />

      <BookingFormModal selected={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}
