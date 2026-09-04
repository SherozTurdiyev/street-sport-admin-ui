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
import { useCan } from '@/features/auth/hooks';
import { BOOKING_STATUS_VIEW, type Booking } from '@/features/bookings/api';
import { useBookingCount, useTodayPanel } from '@/features/bookings/hooks';
import { useVenueOptions } from '@/features/venues/hooks';
import { useSummary } from '@/features/reports/hooks';
import { Growth } from '@/features/reports/tabs/SummaryTab';
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

/**
 * Tashkilot xodimining boshqaruv paneli. Raqamlar BR-08 bo'yicha
 * kesilgan holda keladi: administrator faqat o'ziga biriktirilgan
 * stadionlarning bugungi holatini ko'radi.
 */
export function OrgDashboard() {
  // Oraliqlar HAR RENDERDA qaytadan hisoblansa, `useQuery` kaliti
  // o'zgarib turadi va so'rov cheksiz takrorlanardi.
  const can = useCan();
  // TZ 4.3: tushum ko'rsatkichi `report.profit.*` ruxsatini talab
  // qiladi. Menejer va administratorda u yo'q — ularga pul raqami
  // umuman ko'rsatilmaydi, nol qilib emas, kartochkasi bilan birga.
  const pulKorinadi =
    can('report.profit.total') || can('report.profit.by_venue');

  const bugun = useMemo(() => tashkentDayRange(), []);
  const yaqin = useMemo(() => nextDaysRange(UPCOMING_DAYS), []);

  /*
   * O'sish foizi FAQAT `report.profit.total` bor foydalanuvchida
   * so'raladi. `enabled: false` bo'lgan so'rovda `isPending` mangu
   * `true` bo'lib qoladi — shuning uchun yuklanish holati ham shu
   * bayroq bilan tekshiriladi, aks holda menejer ekranida kartochka
   * doim skelet bo'lib turardi.
   */
  const osishKorinadi = can('report.profit.total');
  const summary = useSummary({}, osishKorinadi);

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
    <div className="flex flex-col gap-4 sm:gap-6">
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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4 sm:gap-6">
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
        {pulKorinadi && (
          <StatCard
            label="Bugungi tushum"
            icon={DollarOutlined}
            tint={figma.warning}
            loading={panel.isPending || (osishKorinadi && summary.isPending)}
            value={formatMoney(
              summary.data?.today.revenue ?? panel.data?.todayRevenue,
            )}
            hint="Bugun qabul qilingan pul — naqd va kartadagi to‘lovlar, qaytarilgani ayirilgan."
            footer={
              summary.data === undefined ? undefined : (
                <div className="flex flex-wrap items-center gap-x-2">
                  <Growth block={summary.data.today} />
                  <Link to="/reports">Hisobotlar</Link>
                </div>
              )
            }
          />
        )}
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
