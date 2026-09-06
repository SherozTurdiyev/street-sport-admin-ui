import { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useSearchParams } from 'react-router';
import { tashkentToday } from '@/shared/format/time';
import { BookingDrawer } from './BookingDrawer';
import { BookingFormModal, type SelectedSlot } from './BookingFormModal';
import { BookingsTable } from './BookingsTable';
import { SeriesTab } from '@/features/series/SeriesTab';
import { CalendarToolbar } from './calendar/CalendarToolbar';
import { DayCalendar } from './calendar/DayCalendar';

const TABS = ['calendar', 'list', 'series'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

function CalendarTab({ onBooking }: { onBooking: (id: string) => void }) {
  const [date, setDate] = useState(tashkentToday);
  const [venueIds, setVenueIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<SelectedSlot | null>(null);

  return (
    <>
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
        onBooking={(booking) => onBooking(booking.id)}
      />
      <BookingFormModal selected={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/**
 * Kalendar — administratorning kunlik ish joyi, ro'yxat esa uning
 * qidiruv oynasi. Ochilgan bron MANZILDA (`?booking=`): kartochka
 * havolasini yuborish mumkin bo'lishi kerak.
 */
export function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = isTab(searchParams.get('tab'))
    ? (searchParams.get('tab') as Tab)
    : 'calendar';

  function patchParams(patch: Record<string, string | null>): void {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  return (
    <Card className="sahifa-kartochka" title="Bronlar">
      <Tabs
        activeKey={tab}
        onChange={(key) => patchParams({ tab: key })}
        items={[
          {
            key: 'calendar',
            label: 'Kalendar',
            children: (
              <CalendarTab onBooking={(id) => patchParams({ booking: id })} />
            ),
          },
          {
            key: 'list',
            label: 'Ro‘yxat',
            children: (
              <BookingsTable
                onOpen={(booking) => patchParams({ booking: booking.id })}
              />
            ),
          },
          {
            key: 'series',
            label: 'Seriyalar',
            children: <SeriesTab />,
          },
        ]}
      />

      <BookingDrawer
        id={searchParams.get('booking')}
        onClose={() => patchParams({ booking: null })}
      />
    </Card>
  );
}
