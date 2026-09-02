import type { ReactNode } from 'react';
import { ArrowRightOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import { Link } from 'react-router';
import { assetUrl } from '@/shared/api/client';
import { figma } from '@/shared/theme/tokens';
import { formatMoney } from '@/shared/format/money';
import type { VenueListRow } from './api';
import {
  SPORT_TYPE_LABELS,
  VENUE_STATUS_VIEW,
  type VenueStatus,
} from './enums';

/**
 * Figma: "Overlay+Border+OverlayBlur" (2009:4497).
 *
 * Jadval o'rniga kartochka: ro'yxatdagi eng qimmatli ma'lumot — stadion
 * FOTOSI, uni jadval katakchasiga sig'dirib bo'lmaydi.
 */

/**
 * Holat belgisining ranglari. Figma'da faqat "Active" chizilgan
 * (yashil 20% fon, 30% chegara, to'q matn); qolgan ikkitasi shu
 * qoidaga ko'ra ogohlantirish va neytral rangdan qurildi — aks holda
 * arxivlangan stadion ham "faol" kabi ko'rinardi.
 */
const STATUS_PILL: Record<
  VenueStatus,
  { bg: string; border: string; color: string }
> = {
  ACTIVE: {
    bg: 'rgba(0, 230, 118, 0.2)',
    border: 'rgba(0, 230, 118, 0.3)',
    color: figma.success,
  },
  TEMPORARILY_CLOSED: {
    bg: 'rgba(253, 199, 0, 0.2)',
    border: 'rgba(253, 199, 0, 0.3)',
    color: figma.warning,
  },
  ARCHIVED: {
    bg: 'rgba(161, 143, 195, 0.2)',
    border: 'rgba(161, 143, 195, 0.3)',
    color: figma.textMuted,
  },
};

/** Kichik, doim bir xil o'lchamli dumaloq tugma (Figma: 36x36). */
const ROUND_BUTTON = {
  width: 36,
  height: 36,
  borderRadius: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

function PhotoArea({ venue }: { venue: VenueListRow }) {
  const primary = venue.photos.find((p) => p.isPrimary) ?? venue.photos[0];
  const pill = STATUS_PILL[venue.status];

  return (
    <div className="relative h-[180px] w-full shrink-0 overflow-hidden">
      {primary ? (
        // `alt` bo'sh EMAS: foto stadionni tanishtiradi, ya'ni ma'no
        // tashiydi. Nom bilan birga o'qilishi kerak.
        <img
          src={assetUrl(primary.url)}
          alt={`${venue.name} fotosi`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${figma.bgInput}, ${figma.bgSider})`,
            color: figma.textMuted,
            fontSize: 13,
          }}
        >
          Foto yo‘q
        </div>
      )}

      {/* Gradient: pastki chekka karta foniga singib ketadi, shunda nom
          bilan foto orasida qattiq chegara ko'rinmaydi. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${figma.bgCard}, rgba(27, 12, 54, 0) 50%)`,
          opacity: 0.9,
        }}
      />

      <span
        className="absolute left-4 top-4 rounded-full px-3 py-[5px] text-xs font-bold"
        style={{
          background: pill.bg,
          border: `1px solid ${pill.border}`,
          color: pill.color,
          backdropFilter: 'blur(6px)',
        }}
      >
        {VENUE_STATUS_VIEW[venue.status].label}
      </span>
    </div>
  );
}

/**
 * Ikkala tugma ham stadion sahifasini ochadi, lekin BOSHQA joyda:
 * tishli g'ildirak narx yonida turibdi va narx qoidalariga olib
 * boradi, o'q esa sahifaning boshiga. Bir xil ish qiladigan ikki
 * tugma foydalanuvchini chalg'itardi.
 */
export function VenueCardLinks({ venue }: { venue: VenueListRow }) {
  return (
    <div className="flex shrink-0 gap-2">
      <Tooltip title="Narxlar">
        <Link to={`/venues/${venue.id}?tab=prices`}>
          <Button
            aria-label={`${venue.name} — narxlar`}
            icon={<SettingOutlined aria-hidden />}
            style={{
              ...ROUND_BUTTON,
              background: figma.bgSider,
              borderColor: figma.border,
            }}
          />
        </Link>
      </Tooltip>
      <Tooltip title="Ochish">
        <Link to={`/venues/${venue.id}`}>
          <Button
            aria-label={`${venue.name} — ochish`}
            icon={<ArrowRightOutlined aria-hidden />}
            style={{
              ...ROUND_BUTTON,
              background: figma.primarySoft,
              borderColor: figma.primarySoftBorder,
            }}
          />
        </Link>
      </Tooltip>
    </div>
  );
}

export function VenueCard({
  venue,
  /**
   * Amallar ATAYLAB tashqaridan: platforma xodimi shu kartochkani
   * tashkilot sahifasida ko'radi, lekin stadion sahifasiga kira
   * olmaydi (uning tashkiloti yo'q). U yerda `null` uzatiladi —
   * ochilmaydigan tugma ko'rsatishdan afzal.
   */
  actions = <VenueCardLinks venue={venue} />,
}: {
  venue: VenueListRow;
  actions?: ReactNode;
}) {
  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        background: 'rgba(27, 12, 54, 0.6)',
        border: `1px solid ${figma.border}`,
        borderRadius: 24,
        backdropFilter: 'blur(12px)',
      }}
    >
      <PhotoArea venue={venue} />

      <div className="flex flex-1 flex-col p-5">
        <Typography.Title level={3} style={{ fontSize: 18, margin: 0 }}>
          {venue.name}
        </Typography.Title>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-[3px] text-xs font-bold"
            style={{
              background: figma.bgSider,
              border: `1px solid ${figma.border}`,
            }}
          >
            {SPORT_TYPE_LABELS[venue.sportType]}
          </span>
          {venue.city !== null && (
            <span style={{ color: figma.textMuted, fontSize: 12 }}>
              {venue.city}
            </span>
          )}
        </div>

        <div
          className="mt-auto flex items-end justify-between gap-3 pt-4"
          style={{ borderTop: `1px solid ${figma.border}` }}
        >
          <div className="min-w-0">
            <div
              style={{
                color: figma.textMuted,
                fontSize: 10,
                letterSpacing: '0.5px',
              }}
            >
              BAZAVIY NARX
            </div>
            {venue.basePricePerHour === null ? (
              // Bazaviy qoidasiz stadionda bron yaratib bo'lmaydi
              // (`PRICE_BASE_RULE_MISSING`) — buni yashirmaslik kerak.
              <div
                style={{ color: figma.warning, fontSize: 14, fontWeight: 700 }}
              >
                Belgilanmagan
              </div>
            ) : (
              <div
                className="truncate"
                style={{
                  color: figma.primaryBright,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {formatMoney(venue.basePricePerHour)}/soat
              </div>
            )}
          </div>

          {actions}
        </div>
      </div>
    </div>
  );
}
