import { api } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';
import type { Amenity, SportType, Surface, VenueStatus } from './enums';

/**
 * Stadion obyektining eng kichik bo'lagi: xodimga stadion biriktirishda
 * faqat nom va id kerak.
 */
export type VenueOption = { id: string; name: string };

export type VenuePhoto = {
  id: string;
  key: string;
  /** Tayyor havola — `/api/v1/files/:id`. Rasmni shu bilan ko'rsating. */
  url: string;
  isPrimary: boolean;
};

/** Vaqtlar `HH:mm`, Toshkent mahalliy vaqtida. */
export type VenueHours = {
  weekday: number;
  opensAt: string;
  closesAt: string;
};

export type VenueClosure = {
  id: string;
  venueId: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  createdBy: string;
  createdAt: string;
};

export type Venue = {
  id: string;
  orgId: string;
  name: string;
  sportType: SportType;
  surface: Surface | null;
  sizeLabel: string | null;
  isIndoor: boolean;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  /** Bron qadamining uzunligi: 60 bo'lsa bron butun soatdan boshlanadi. */
  slotMinutes: number;
  amenities: Amenity[];
  photos: VenuePhoto[];
  description: string | null;
  status: VenueStatus;
  createdAt: string;
  updatedAt: string;
};

/** Kartochka: stadion obyekti, ustiga ish vaqti va yopilishlar. */
export type VenueDetail = Venue & {
  hours: VenueHours[];
  closures: VenueClosure[];
};

export type VenuesQuery = PageQuery & {
  city?: string;
  sportType?: SportType;
  status?: VenueStatus;
  search?: string;
};

export type VenueInput = {
  name: string;
  sportType: SportType;
  surface?: Surface | null;
  sizeLabel?: string | null;
  isIndoor?: boolean;
  city?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  slotMinutes?: number;
  amenities?: Amenity[];
  description?: string | null;
};

export const CANCEL_REASON_LABELS = {
  CUSTOMER_REFUSED: 'Mijoz voz kechdi',
  WEATHER: 'Ob-havo',
  VENUE_ISSUE: 'Stadion muammosi',
  DOUBLE_BOOKING: 'Ikki marta bron',
  OTHER: 'Boshqa',
} as const;

export type CancelReason = keyof typeof CANCEL_REASON_LABELS;

export type ClosureInput = {
  /** ISO UTC. */
  startsAt: string;
  endsAt: string;
  reason: string;
  /**
   * Davrda bron bo'lsa va bu berilmasa, backend
   * `VENUE_CLOSURE_HAS_BOOKINGS` (409) qaytaradi — bron jimgina
   * yo'qolib qolmasligi uchun ataylab qo'yilgan to'siq.
   */
  cancelBookings?: boolean;
  cancelReason?: CancelReason;
};

export const venuesApi = {
  options: () =>
    api
      .get<Paginated<VenueOption>>('/venues', { params: { pageSize: 100 } })
      .then((r) => r.data.items),

  list: (query: VenuesQuery) =>
    api.get<Paginated<Venue>>('/venues', { params: query }).then((r) => r.data),

  detail: (id: string) =>
    api.get<VenueDetail>(`/venues/${id}`).then((r) => r.data),

  create: (input: VenueInput) =>
    api.post<Venue>('/venues', input).then((r) => r.data),

  update: (id: string, input: Partial<VenueInput>) =>
    api.patch<Venue>(`/venues/${id}`, input).then((r) => r.data),

  /**
   * `confirm` faol bronlari bor stadion uchun MAJBURIY. Usiz backend
   * `VENUE_HAS_ACTIVE_BOOKINGS` (409) qaytaradi — bu tasdiq so'rash
   * uchun ataylab qo'yilgan to'siq, xato emas.
   */
  archive: (id: string, confirm: boolean) =>
    api.post<Venue>(`/venues/${id}/archive`, { confirm }).then((r) => r.data),

  restore: (id: string) =>
    api.post<Venue>(`/venues/${id}/restore`).then((r) => r.data),

  /**
   * `multipart/form-data`, maydon nomi `file`. `Content-Type` ATAYLAB
   * qo'lda berilmaydi: brauzer uni chegara (`boundary`) bilan birga
   * o'zi qo'yadi, qo'lda yozilsa so'rov o'qib bo'lmas holga keladi.
   */
  addPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<{ photos: VenuePhoto[] }>(`/venues/${id}/photos`, form)
      .then((r) => r.data.photos);
  },

  removePhoto: (id: string, photoId: string) =>
    api
      .delete<{ photos: VenuePhoto[] }>(`/venues/${id}/photos/${photoId}`)
      .then((r) => r.data.photos),

  addClosure: (id: string, input: ClosureInput) =>
    api.post<VenueClosure>(`/venues/${id}/closures`, input).then((r) => r.data),

  removeClosure: (id: string, closureId: string) =>
    api
      .delete<{ id: string }>(`/venues/${id}/closures/${closureId}`)
      .then((r) => r.data),

  hours: (id: string) =>
    api
      .get<{ venueId: string; hours: VenueHours[] }>(`/venues/${id}/hours`)
      .then((r) => r.data.hours),

  /** `PUT` — jadval TO'LIQ almashtiriladi; kirmagan kun yopiq hisoblanadi. */
  setHours: (id: string, hours: VenueHours[]) =>
    api
      .put<{ venueId: string; hours: VenueHours[] }>(`/venues/${id}/hours`, {
        hours,
      })
      .then((r) => r.data.hours),
};
