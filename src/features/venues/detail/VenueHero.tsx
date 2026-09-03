import { useState, type ReactNode } from 'react';
import { Alert, App, Button, Space, Typography } from 'antd';
import { Link } from 'react-router';
import { assetUrl } from '@/shared/api/client';
import { errorCode, errorMessage } from '@/shared/api/error-handler';
import { figma } from '@/shared/theme/tokens';
import type { VenueDetail } from '../api';
import { SPORT_TYPE_LABELS, VENUE_STATUS_VIEW } from '../enums';
import { useArchiveVenue, useRestoreVenue } from '../hooks';

/**
 * Figma: sahifa boshidagi karta (2020:8496) — 128x128 foto kartaning
 * yuqori chetidan chiqib turadi, yonida nom va holat belgisi, o'ng
 * tomonda ikkita amal tugmasi.
 */

const STATUS_DOT: Record<keyof typeof VENUE_STATUS_VIEW, string> = {
  ACTIVE: figma.success,
  TEMPORARILY_CLOSED: figma.warning,
  ARCHIVED: figma.textMuted,
};

function Photo({ venue }: { venue: VenueDetail }) {
  const primary = venue.photos.find((p) => p.isPrimary) ?? venue.photos[0];
  const style = {
    width: 128,
    height: 128,
    borderRadius: figma.radiusCard,
    border: `2px solid ${figma.border}`,
  } as const;

  return primary ? (
    <img
      src={assetUrl(primary.url)}
      alt={`${venue.name} fotosi`}
      className="shrink-0 object-cover"
      style={style}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        ...style,
        background: `linear-gradient(135deg, ${figma.bgInput}, ${figma.bgSider})`,
        color: figma.textMuted,
        fontSize: 12,
      }}
    >
      Foto yo‘q
    </div>
  );
}

/**
 * Amallar ATAYLAB alohida komponentada: platforma xodimi shu kartani
 * ko'radi, lekin tahrirlash va arxivlash unga yopiq. Tugmalar shu
 * yerda turgani uchun platforma sahifasida mutatsiya hooklari ham,
 * tahrirlash oynasi ham umuman yaratilmaydi.
 */
export function VenueHeroActions({
  venue,
  onError,
}: {
  venue: VenueDetail;
  onError: (xato: string | null) => void;
}) {
  const { message } = App.useApp();
  const archive = useArchiveVenue(venue.id);
  const restore = useRestoreVenue(venue.id);
  /**
   * Faol bronlari bor stadionni arxivlash `confirm: true` talab qiladi.
   * Darrov `true` yuborish to'siqni ma'nosiz qilardi: u aynan
   * ogohlantirish uchun qo'yilgan.
   */
  const [tasdiqKerak, setTasdiqKerak] = useState(false);

  async function arxivla(confirm: boolean): Promise<void> {
    onError(null);
    try {
      await archive.mutateAsync(confirm);
      message.success('Stadion arxivlandi');
      setTasdiqKerak(false);
    } catch (e) {
      onError(errorMessage(e));
      if (errorCode(e) === 'VENUE_HAS_ACTIVE_BOOKINGS') setTasdiqKerak(true);
    }
  }

  return (
    <Space wrap>
      <Link to={`/venues/${venue.id}/edit`}>
        <Button>Tahrirlash</Button>
      </Link>
      {venue.status === 'ARCHIVED' ? (
        <Button
          type="primary"
          loading={restore.isPending}
          onClick={() =>
            void restore
              .mutateAsync()
              .then(() => message.success('Stadion qaytarildi'))
              .catch((e: unknown) => onError(errorMessage(e)))
          }
        >
          Arxivdan qaytarish
        </Button>
      ) : (
        <Button
          danger
          loading={archive.isPending}
          onClick={() => void arxivla(tasdiqKerak)}
        >
          {tasdiqKerak ? 'Baribir arxivlash' : 'Arxivlash'}
        </Button>
      )}
    </Space>
  );
}

export function VenueHero({
  venue,
  /** Qo'shimcha yozuv — platformada stadion qaysi tashkilotniki ekani. */
  meta = null,
  actions,
}: {
  venue: VenueDetail;
  meta?: ReactNode;
  /** Berilmasa amallar chizilmaydi: karta faqat o'qish uchun bo'ladi. */
  actions?: (onError: (xato: string | null) => void) => ReactNode;
}) {
  const [xato, setXato] = useState<string | null>(null);
  const status = VENUE_STATUS_VIEW[venue.status];

  return (
    <div
      className="flex flex-wrap items-center gap-6 p-6"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: figma.radiusCard,
      }}
    >
      <Photo venue={venue} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <Typography.Title level={1} style={{ fontSize: 30, margin: 0 }}>
            {venue.name}
          </Typography.Title>
          <span
            className="flex items-center gap-2 rounded-full px-3 py-1"
            style={{
              background: figma.bgSider,
              border: `1px solid ${figma.border}`,
              fontSize: 12,
            }}
          >
            <span
              aria-hidden
              className="inline-block size-2 rounded-full"
              style={{ background: STATUS_DOT[venue.status] }}
            />
            {status.label}
          </span>
          {meta}
        </div>

        <div
          className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1"
          style={{ color: figma.textMuted, fontSize: 13 }}
        >
          <span>{SPORT_TYPE_LABELS[venue.sportType]}</span>
          {venue.city !== null && <span>{venue.city}</span>}
          {venue.address !== null && <span>{venue.address}</span>}
          <span>{venue.isIndoor ? 'Yopiq maydon' : 'Ochiq maydon'}</span>
        </div>

        {xato !== null && (
          <Alert className="mt-3" type="error" showIcon message={xato} />
        )}
      </div>

      {actions?.(setXato)}
    </div>
  );
}
