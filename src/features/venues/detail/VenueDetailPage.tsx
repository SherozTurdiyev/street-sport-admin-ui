import { useMemo, useState } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Skeleton, Space, Tabs, Typography } from 'antd';
import { useParams, useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import { TASHKENT } from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { useCan } from '@/features/auth/hooks';
import { BookingDrawer } from '@/features/bookings/BookingDrawer';
import {
  BookingFormModal,
  type SelectedSlot,
} from '@/features/bookings/BookingFormModal';
import { useBookingCount, useDayCalendar } from '@/features/bookings/hooks';
import { StatCard } from '@/features/dashboard/StatCard';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { ClosuresTab } from '../ClosuresTab';
import { AdminsTab } from './AdminsTab';
import { PhotosTab } from '../PhotosTab';
import { WeeklyHoursForm } from '../WeeklyHoursForm';
import { PriceRulesTab } from '../prices/PriceRulesTab';
import { usePriceRules } from '../prices/hooks';
import { useVenue } from '../hooks';
import { DayBookings } from './DayBookings';
import { SlotGrid } from './SlotGrid';
import { VenueHero, VenueHeroActions } from './VenueHero';
import { VenueSpecs } from './VenueSpecs';
import {
  bookedMinutes,
  buildSlots,
  dayRevenue,
  occupancy,
  openMinutes,
  activeBookings,
} from '@/features/bookings/slots';

const TABS = ['hours', 'prices', 'photos', 'closures', 'admins'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

/** Dushanba = 1, yakshanba = 7 — backend shunday sanaydi. */
function weekdayOf(date: string): number {
  const d = dayjs(date).day();
  return d === 0 ? 7 : d;
}

function DaySwitcher({
  date,
  onChange,
}: {
  date: string;
  onChange: (next: string) => void;
}) {
  return (
    <Space>
      <Button
        aria-label="Oldingi kun"
        icon={<LeftOutlined aria-hidden />}
        onClick={() =>
          onChange(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'))
        }
      />
      <Typography.Text strong>
        {dayjs(date).format('DD.MM.YYYY')}
      </Typography.Text>
      <Button
        aria-label="Keyingi kun"
        icon={<RightOutlined aria-hidden />}
        onClick={() => onChange(dayjs(date).add(1, 'day').format('YYYY-MM-DD'))}
      />
    </Space>
  );
}

export function VenueDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  // Boshlang'ich kun TOSHKENT sanasi: brauzer boshqa mintaqada bo'lsa
  // ham stadionning kuni ko'rsatilishi kerak (BR-12).
  const [date, setDate] = useState(() =>
    dayjs().tz(TASHKENT).format('YYYY-MM-DD'),
  );

  const can = useCan();
  const [tanlangan, setTanlangan] = useState<SelectedSlot | null>(null);

  const venue = useVenue(id);
  const day = useDayCalendar(date, id);
  const jami = useBookingCount({ venueId: id });
  const rules = usePriceRules(id);

  const kun = day.data?.venue ?? null;
  const bronlar = useMemo(
    () => activeBookings(kun?.bookings ?? []),
    [kun?.bookings],
  );
  const slots = useMemo(
    () =>
      kun && day.data ? buildSlots(kun, day.data.from, weekdayOf(date)) : [],
    [kun, day.data, date],
  );

  const ochiq = kun ? openMinutes(kun.hours, weekdayOf(date)) : 0;
  const band = bookedMinutes(bronlar);
  const bazaviy = rules.data?.find((rule) => rule.isBase)?.pricePerHour ?? null;

  const tab = isTab(searchParams.get('tab'))
    ? searchParams.get('tab')!
    : 'hours';

  /** `tab` ni yo'qotmasdan bitta parametrni almashtiradi. */
  function patchParams(patch: Record<string, string | null>): void {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  if (venue.error !== null) {
    return <Alert type="error" showIcon message={errorMessage(venue.error)} />;
  }
  if (venue.isPending || !venue.data) return <Skeleton active />;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <VenueHero
        venue={venue.data}
        actions={(onError) => (
          <VenueHeroActions venue={venue.data} onError={onError} />
        )}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4 sm:gap-6">
        <StatCard
          label="Jami bronlar"
          icon={CalendarOutlined}
          tint={figma.primaryBright}
          loading={jami.isPending}
          value={jami.data ?? 0}
        />
        <StatCard
          label="Shu kundagi bronlar"
          icon={ClockCircleOutlined}
          tint={figma.success}
          loading={day.isPending}
          value={bronlar.length}
        />
        <StatCard
          label="Shu kundagi tushum"
          icon={DollarOutlined}
          tint={figma.warning}
          loading={day.isPending}
          value={formatMoney(dayRevenue(bronlar))}
          hint="Shu kunda yakunlangan bronlar summasi. Kassaga tushgan pul — smena hisobida."
        />
        <StatCard
          label="Bandlik"
          icon={PieChartOutlined}
          tint={figma.textMuted}
          loading={day.isPending}
          value={`${occupancy(ochiq, band)}%`}
          hint="Band qilingan vaqtning shu kundagi ish vaqtiga nisbati."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4 sm:gap-6">
          <Card
            title="Vaqt jadvali"
            extra={<DaySwitcher date={date} onChange={setDate} />}
          >
            {day.isPending ? (
              <Skeleton active />
            ) : (
              <SlotGrid
                slots={slots}
                // Bron qila olmaydigan xodimda bo'sh katak bosilmaydi:
                // oyna ochilib, keyin 403 qaytishi chalg'ituvchi bo'lardi.
                onSlot={
                  kun && can('booking.create')
                    ? (slot) => setTanlangan({ venue: kun, slot })
                    : undefined
                }
                onBooking={(booking) => patchParams({ booking: booking.id })}
              />
            )}
          </Card>

          <Card title="Shu kundagi bronlar">
            {day.isPending ? (
              <Skeleton active />
            ) : (
              <DayBookings bookings={bronlar} />
            )}
          </Card>
        </div>

        <Card title="Stadion tavsifi">
          <VenueSpecs venue={venue.data} basePricePerHour={bazaviy} />
        </Card>
      </div>

      {/* Boshqaruv bo'limlari sahifaning pastida: yuqoridagi qism
          "qanday ketyapti?" degan savolga javob beradi, bu yerda esa
          sozlamalar o'zgartiriladi. Manzildagi `tab` ni saqlab qolish
          havolani yuborish imkonini beradi. */}
      <Card>
        <Tabs
          activeKey={tab}
          onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
          items={[
            {
              key: 'hours',
              label: 'Ish vaqti',
              children: <WeeklyHoursForm venueId={id} />,
            },
            {
              key: 'prices',
              label: 'Narxlar',
              children: <PriceRulesTab venueId={id} />,
            },
            {
              key: 'photos',
              label: 'Fotolar',
              children: <PhotosTab venueId={id} />,
            },
            {
              key: 'closures',
              label: 'Yopilishlar',
              children: <ClosuresTab venueId={id} />,
            },
            /*
             * Adminlar bo'limi FAQAT biriktirish ruxsati borlarga
             * (direktor va menejer). Administratorning o'zi bu ro'yxatni
             * ko'rsa, o'zgartira olmasdi va tugma 403 qaytarardi.
             */
            ...(can('member.venue.assign')
              ? [
                  {
                    key: 'admins',
                    label: 'Adminlar',
                    children: <AdminsTab venueId={id} />,
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <BookingFormModal
        selected={tanlangan}
        onClose={() => setTanlangan(null)}
      />
      <BookingDrawer
        id={searchParams.get('booking')}
        onClose={() => patchParams({ booking: null })}
      />
    </div>
  );
}
