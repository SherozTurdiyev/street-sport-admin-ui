import { useMemo } from 'react';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { Alert, Card, Empty, Skeleton, Tag, Typography } from 'antd';
import { Link } from 'react-router';
import { errorMessage } from '@/shared/api/error-handler';
import { formatMoney } from '@/shared/format/money';
import {
  formatTime,
  nextDaysRange,
  tashkentDayRange,
} from '@/shared/format/time';
import { figma } from '@/shared/theme/tokens';
import { BOOKING_STATUS_VIEW, type Booking } from '@/features/bookings/api';
import { useBookingCount, useTodayPanel } from '@/features/bookings/hooks';
import { useVenueOptions } from '@/features/venues/hooks';
import { StatCard } from './StatCard';

/** "Yaqin bronlar" oynasi — bir hafta. */
const UPCOMING_DAYS = 7;

function NextGames({
  games,
  venueName,
}: {
  games: Booking[];
  venueName: (venueId: string) => string;
}) {
  if (games.length === 0) {
    return <Empty description="Bugun boshqa o‘yin qolmadi" />;
  }

  return (
    <div className="flex flex-col">
      {games.map((game) => {
        const status = BOOKING_STATUS_VIEW[game.status];
        return (
          <div
            key={game.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
            style={{ borderTop: `1px solid ${figma.border}` }}
          >
            <div className="min-w-0">
              <Typography.Text strong style={{ fontSize: 16 }}>
                {formatTime(game.startsAt)} – {formatTime(game.endsAt)}
              </Typography.Text>
              <div
                className="truncate"
                style={{ color: figma.textMuted, fontSize: 12 }}
              >
                {venueName(game.venueId)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Typography.Text strong>
                {formatMoney(game.priceTotal)}
              </Typography.Text>
              <Tag color={status.color}>{status.label}</Tag>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  // Oraliqlar HAR RENDERDA qaytadan hisoblansa, `useQuery` kaliti
  // o'zgarib turadi va so'rov cheksiz takrorlanardi.
  const bugun = useMemo(() => tashkentDayRange(), []);
  const yaqin = useMemo(() => nextDaysRange(UPCOMING_DAYS), []);

  const panel = useTodayPanel();
  const bugungi = useBookingCount(bugun);
  const kelayotgan = useBookingCount({ ...yaqin, status: 'CONFIRMED' });
  const stadionlar = useVenueOptions(true);

  const nomlar = useMemo(
    () => new Map((stadionlar.data ?? []).map((v) => [v.id, v.name])),
    [stadionlar.data],
  );

  const xato = panel.error ?? bugungi.error ?? kelayotgan.error;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Boshqaruv paneli
        </Typography.Title>
        <Typography.Text style={{ color: figma.textMuted }}>
          Tashkilotingiz bo‘yicha bugungi holat.
        </Typography.Text>
      </div>

      {xato === null || xato === undefined ? null : (
        <Alert type="error" showIcon message={errorMessage(xato)} />
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
        <StatCard
          label="Bugungi bronlar"
          icon={CalendarOutlined}
          tint={figma.primaryBright}
          loading={bugungi.isPending}
          value={bugungi.data ?? 0}
        />
        <StatCard
          label={`Yaqin ${UPCOMING_DAYS} kun`}
          icon={RiseOutlined}
          tint={figma.success}
          loading={kelayotgan.isPending}
          value={kelayotgan.data ?? 0}
        />
        <StatCard
          label="Bugungi tushum"
          icon={DollarOutlined}
          tint={figma.warning}
          loading={panel.isPending}
          value={formatMoney(panel.data?.todayRevenue)}
          // Raqamning to'liq emasligini ekranda aytish SHART: aks holda
          // direktor uni kassa hisoboti deb o'qirdi.
          hint="Hozircha yakunlangan bronlar summasi. To‘lovlar moduli (M8) qo‘shilgach haqiqiy kassa ko‘rsatiladi."
        />
        <StatCard
          label="Bugun bo‘sh soatlar"
          icon={ClockCircleOutlined}
          tint={figma.textMuted}
          loading={panel.isPending}
          value={`${panel.data?.freeHours ?? 0} soat`}
        />
      </div>

      <Card title="Yaqin o‘yinlar" extra={<Link to="/venues">Stadionlar</Link>}>
        {panel.isPending ? (
          <Skeleton active />
        ) : (
          <NextGames
            games={panel.data?.nextGames ?? []}
            venueName={(venueId) => nomlar.get(venueId) ?? '—'}
          />
        )}
      </Card>
    </div>
  );
}
