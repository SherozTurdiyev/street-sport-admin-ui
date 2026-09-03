import { Empty, Tooltip } from 'antd';
import { figma } from '@/shared/theme/tokens';
import type { Booking } from '@/features/bookings/api';
import type { Slot, SlotStatus } from '@/features/bookings/slots';

/**
 * Figma: "Time Slot Manager" (2020:8587) — kunning ish vaqti
 * `slotMinutes` qadam bilan bo'lingan kataklar.
 *
 * Katak — TUGMA: bo'sh soatga bosilsa tez bron oynasi, band soatga
 * bosilsa bron kartochkasi ochiladi. Ilgari panjara faqat rasm edi va
 * operator o'sha soatni bron qilish uchun boshqa sahifaga o'tishga
 * majbur bo'lardi.
 */

const VIEW: Record<SlotStatus, { label: string; color: string; bg: string }> = {
  FREE: {
    label: 'Bo‘sh',
    color: figma.success,
    bg: 'rgba(0, 230, 118, 0.12)',
  },
  BOOKED: {
    label: 'Band',
    color: figma.primaryBright,
    bg: figma.primarySoft,
  },
  LIVE: {
    label: 'Hozir',
    color: figma.warning,
    bg: 'rgba(253, 199, 0, 0.18)',
  },
  CLOSED: {
    label: 'Yopiq',
    color: figma.danger,
    bg: 'rgba(251, 44, 54, 0.12)',
  },
  PAST: {
    label: 'O‘tdi',
    color: figma.textMuted,
    bg: 'transparent',
  },
};

/** Izohda faqat foydalanuvchi ko'radigan holatlar. */
const LEGEND: SlotStatus[] = ['FREE', 'BOOKED', 'LIVE', 'PAST'];

export function SlotGrid({
  slots,
  onSlot,
  onBooking,
}: {
  slots: readonly Slot[];
  /** Bo'sh katak bosildi. Berilmasa bo'sh katak bosilmaydi. */
  onSlot?: (slot: Slot) => void;
  /** Broni bor katak bosildi. */
  onBooking?: (booking: Booking) => void;
}) {
  if (slots.length === 0) {
    return <Empty description="Bu kuni stadion yopiq" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {LEGEND.map((status) => (
          <span
            key={status}
            className="flex items-center gap-2"
            style={{ color: figma.textMuted, fontSize: 12 }}
          >
            <span
              aria-hidden
              className="inline-block size-2 rounded-full"
              style={{ background: VIEW[status].color }}
            />
            {VIEW[status].label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(88px,1fr))] sm:gap-3">
        {slots.map((slot) => {
          const view = VIEW[slot.status];
          const booking = slot.booking;
          // O'tib ketgan bo'sh soatga bron qilib bo'lmaydi, lekin
          // o'tgan bronni ochish mumkin — natijasi shu yerda qo'yiladi.
          const action = booking
            ? onBooking && (() => onBooking(booking))
            : slot.status === 'FREE' && onSlot
              ? () => onSlot(slot)
              : undefined;

          return (
            <Tooltip key={slot.startsAt} title={view.label}>
              <button
                type="button"
                disabled={action === undefined}
                onClick={action}
                aria-label={
                  booking
                    ? `${slot.label} — bronni ochish`
                    : action
                      ? `${slot.label} — bron qilish`
                      : `${slot.label} — ${view.label}`
                }
                className="flex flex-col items-center justify-center py-2 transition-transform enabled:cursor-pointer enabled:hover:-translate-y-0.5 sm:py-3"
                style={{
                  background: view.bg,
                  border: `1px solid ${slot.status === 'PAST' ? figma.border : view.color}`,
                  borderRadius: figma.radiusPill,
                  color: view.color,
                  fontWeight: 700,
                }}
              >
                {slot.label}
                {/* Bandlik sababi katak ostida: soatga qarab turgan odam
                    "nega band?" deb kartochkani ochishga majbur bo'lmasin. */}
                <span style={{ fontSize: 10, fontWeight: 400 }}>
                  {slot.status === 'FREE' || slot.status === 'PAST'
                    ? ' '
                    : view.label}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
