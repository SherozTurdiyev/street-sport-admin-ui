import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';
import type { SportType } from '@/features/venues/enums';

/**
 * Bron obyekti — barcha bron endpoint'lari aynan shu shaklni qaytaradi
 * (`docs/API.md`, 11-bo'lim).
 *
 * Vaqt oralig'i YARIM OCHIQ `[startsAt, endsAt)`: 19:00–20:00 va
 * 20:00–21:00 to'qnashmaydi.
 */
export type Booking = {
  id: string;
  venueId: string;
  customerId: string;
  seriesId: string | null;
  startsAt: string;
  endsAt: string;
  /** Pul SATR (BR-13) — `Number` ga o'girilmaydi. */
  priceTotal: string;
  discount: string;
  status: BookingStatus;
  source: 'PANEL' | 'PUBLIC' | 'IMPORT';
  cancelReason: string | null;
  createdAt: string;
};

export const BOOKING_STATUS_VIEW = {
  PENDING: { label: 'Kutilmoqda', color: 'default' },
  CONFIRMED: { label: 'Tasdiqlangan', color: 'processing' },
  COMPLETED: { label: 'Yakunlangan', color: 'success' },
  NO_SHOW: { label: 'Kelmadi', color: 'warning' },
  CANCELLED: { label: 'Bekor qilingan', color: 'error' },
} as const;

export type BookingStatus = keyof typeof BOOKING_STATUS_VIEW;

/**
 * Bekor qilish sababi MAJBURIY (BR-07): u statistikaga kiradi va
 * "nega bekor qilindi?" degan savol javobsiz qolmasligi kerak.
 *
 * Ro'yxat shu yerda: sabab bron bekor qilinganda ham, stadion
 * vaqtinchalik yopilib bronlar bekor qilinganda ham bir xil.
 */
export const CANCEL_REASON_LABELS = {
  CUSTOMER_REFUSED: 'Mijoz voz kechdi',
  WEATHER: 'Ob-havo',
  VENUE_ISSUE: 'Stadion muammosi',
  DOUBLE_BOOKING: 'Ikki marta bron',
  OTHER: 'Boshqa',
} as const;

export type CancelReason = keyof typeof CANCEL_REASON_LABELS;

export type BookingsQuery = PageQuery & {
  search?: string;
  status?: BookingStatus;
  venueId?: string;
  /** ISO UTC. */
  from?: string;
  to?: string;
};

/**
 * F6.10 — bosh sahifadagi panel.
 *
 * `todayRevenue` va `unpaidCount` M8 (to'lovlar) gacha vaqtinchalik
 * manbadan hisoblanadi; `pendingModule` shuni ochiq aytadi va ekranda
 * ham aytilishi kerak — aks holda direktor to'liq bo'lmagan raqamga
 * qarab qaror qabul qilardi.
 */
export type TodayPanel = {
  /** Toshkent sanasi, `YYYY-MM-DD`. */
  date: string;
  /** Eng yaqin uchta bron. */
  nextGames: Booking[];
  todayRevenue: string;
  unpaidCount: number;
  freeHours: number;
  pendingModule: 'M8';
};

/**
 * Kunlik kalendar: panjarani chizish uchun kerakli HAMMA narsa bitta
 * javobda — ish vaqti, yopilishlar va bronlar.
 *
 * `from` va `to` — so'ralgan Toshkent kunining UTC chegaralari. Ular
 * ataylab serverdan keladi: mintaqa hisob-kitobi ikki joyda
 * takrorlansa, ular vaqt o'tishi bilan bir-biridan farq qila boshlaydi.
 */
export type CalendarVenue = {
  venueId: string;
  name: string;
  slotMinutes: number;
  status: string;
  hours: { weekday: number; opensAt: string; closesAt: string }[];
  closures: { startsAt: string; endsAt: string; reason: string }[];
  bookings: Booking[];
};

export type DayCalendar = {
  date: string;
  from: string;
  to: string;
  venues: CalendarVenue[];
};

/** Kartochka: bron obyekti ustiga stadion va mijoz. */
export type BookingCard = Booking & {
  venue: {
    id: string;
    name: string;
    sportType: SportType;
    slotMinutes: number;
  };
  /** Anonim bronda `null`. */
  customer: {
    id: string;
    phone: string;
    fullName: string;
    isBlacklisted: boolean;
  } | null;
};

/**
 * Narx bu yerda YO'Q va bo'lmasligi kerak: uni server narx
 * qoidalaridan hisoblaydi. Mijozdan qabul qilinsa, ikki tomonda ikki
 * xil raqam paydo bo'lardi.
 */
export type CreateBookingInput = {
  venueId: string;
  /** Berilmasa — anonim bron. */
  customerId?: string;
  startsAt: string;
  endsAt: string;
  /** So'm, SATR (BR-13). */
  discount?: string;
  note?: string;
};

/** `warnings` — masalan `["CUSTOMER_BLACKLISTED"]`. Taqiq emas, ogohlantirish. */
export type CreatedBooking = Booking & { warnings: string[] };

/**
 * Hammasi ixtiyoriy, lekin kamida bittasi kerak. `confirmPriceChange`
 * faqat server `BOOKING_PRICE_CHANGED` qaytargandan keyin yuboriladi.
 */
export type MoveBookingInput = {
  venueId?: string;
  startsAt?: string;
  endsAt?: string;
  confirmPriceChange?: boolean;
};

export type CancelBookingInput = { reason: CancelReason; comment?: string };

/** O'yin natijasi faqat `endsAt` o'tgandan keyin qo'yiladi. */
export type BookingResult = 'COMPLETED' | 'NO_SHOW';

export const bookingsApi = {
  search: (query: BookingsQuery) =>
    api
      .get<Paginated<Booking>>('/bookings', { params: query })
      .then((r) => r.data),

  todayPanel: () =>
    api.get<TodayPanel>('/bookings/today-panel').then((r) => r.data),

  /** `date` — `YYYY-MM-DD`, Toshkent kuni. */
  calendarDay: (date: string, venueIds?: string[]) =>
    api
      .get<DayCalendar>('/bookings/calendar/day', {
        params: { date, venueIds },
      })
      .then((r) => r.data),

  card: (id: string) =>
    api.get<BookingCard>(`/bookings/${id}`).then((r) => r.data),

  create: (input: CreateBookingInput) =>
    api.post<CreatedBooking>('/bookings', input).then((r) => r.data),

  move: (id: string, input: MoveBookingInput) =>
    api
      .patch<CreatedBooking>(`/bookings/${id}/move`, input)
      .then((r) => r.data),

  cancel: (id: string, input: CancelBookingInput) =>
    api.post<Booking>(`/bookings/${id}/cancel`, input).then((r) => r.data),

  setResult: (id: string, result: BookingResult) =>
    api.post<Booking>(`/bookings/${id}/result`, { result }).then((r) => r.data),
};
