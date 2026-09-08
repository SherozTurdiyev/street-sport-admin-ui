import { api } from '@/shared/api/client';
import type { PageQuery, Paginated, Role } from '@/shared/api/types';
import type {
  VenueClosure,
  VenueHours,
  VenueListRow,
} from '@/features/venues/api';
import type { SportType, VenueStatus } from '@/features/venues/enums';
import type { PriceRule } from '@/features/venues/prices/api';

/**
 * AMALDAGI holat — hisoblangan. `subscriptionStatus` (bazadagi ustun)
 * dan farq qiladi va interfeys FAQAT shuni ko'rsatadi: obuna sanasi
 * hech kim tegmasdan o'tib ketadi, shuning uchun ustunda `ACTIVE`
 * turgan tashkilot amalda `EXPIRED` bo'lishi mumkin.
 */
export type EffectiveStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export type OrganizationStats = {
  venueCount: number;
  memberCount: number;
  bookingCount: number;
  /** Oxirgi bron yaratilgan payt. `null` — hali ishlatilmagan. */
  lastActivityAt: string | null;
};

/** Tashkilotning platforma qo'shimchalarisiz asosiy maydonlari. */
export type BaseOrganization = {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  subscriptionStatus: string;
  subscriptionEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlatformOrganization = BaseOrganization & {
  blockReason: string | null;
  blockedAt: string | null;
  effectiveStatus: EffectiveStatus;
  isBlocked: boolean;
  stats: OrganizationStats;
};

export type OrganizationDirector = {
  userId: string;
  fullName: string;
  phone: string;
  isActive: boolean;
};

export type PlatformOrganizationDetail = PlatformOrganization & {
  directors: OrganizationDirector[];
};

/** `venueIds` bu yerda qaytmaydi — biriktirish tashkilotning o'z ishi. */
export type OrganizationMember = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  role: Exclude<Role, 'SUPER_ADMIN'>;
  isActive: boolean;
  lastLoginAt: string | null;
};

/**
 * Platforma endpointi `GET /venues` bilan BIR XIL obyektni qaytaradi —
 * fotolari va bazaviy narxi bilan. Farqi ikkita: arxivlanganlar ham
 * ko'rinadi va yozuv faqat o'qish uchun.
 */
export type OrganizationVenue = VenueListRow;

/**
 * Platforma ro'yxatida stadion qaysi tashkilotniki ekani ko'rinib
 * turishi shart — bir nechta tashkilotning stadionlari aralash keladi.
 */
export type PlatformVenue = VenueListRow & {
  organization: { id: string; name: string };
};

/**
 * Stadion kartochkasi bitta javobda keladi: platformada tahrirlash
 * yo'q, ya'ni har bo'lim uchun alohida so'rov ham kerak emas.
 *
 * Bronlar va tushum bu yerda YO'Q — TZ 4.2 bo'yicha ish ma'lumoti
 * platformaga yopiq.
 */
export type PlatformVenueCard = PlatformVenue & {
  hours: VenueHours[];
  closures: VenueClosure[];
  priceRules: PriceRule[];
};

export type PlatformVenuesQuery = PageQuery & {
  orgId?: string;
  city?: string;
  sportType?: SportType;
  status?: VenueStatus;
  search?: string;
};

export type OrganizationsQuery = PageQuery & {
  search?: string;
  /** Filtr AMALDAGI holat bo'yicha va bazada bajariladi. */
  status?: EffectiveStatus;
};

export type CreateOrganizationInput = {
  name: string;
  director: { fullName: string; phone: string };
};

export type CreatedOrganization = {
  organization: BaseOrganization;
  director: { userId: string; fullName: string; phone: string };
  /** Bir martalik: bazada faqat hash saqlanadi va jurnalga yozilmaydi. */
  temporaryPassword: string;
};

/**
 * `subscriptionStatus` ATAYLAB yo'q — backend uni rad etadi (400).
 * Holat faqat `block` va `unblock` orqali o'zgaradi, aks holda sababsiz
 * bloklangan tashkilotlar paydo bo'lardi.
 */
export type UpdateOrganizationInput = {
  name?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  /** `null` — muddatsiz. */
  subscriptionEndsAt?: string | null;
};

const ROOT = '/platform/organizations';

export const platformApi = {
  list: (query: OrganizationsQuery) =>
    api
      .get<Paginated<PlatformOrganization>>(ROOT, { params: query })
      .then((r) => r.data),

  detail: (id: string) =>
    api.get<PlatformOrganizationDetail>(`${ROOT}/${id}`).then((r) => r.data),

  create: (input: CreateOrganizationInput) =>
    api.post<CreatedOrganization>(ROOT, input).then((r) => r.data),

  update: (id: string, input: UpdateOrganizationInput) =>
    api.patch<PlatformOrganization>(`${ROOT}/${id}`, input).then((r) => r.data),

  /** `reason` majburiy (3–300 belgi) — bloklash sababi keyin kerak bo'ladi. */
  block: (id: string, reason: string) =>
    api
      .post<PlatformOrganization>(`${ROOT}/${id}/block`, { reason })
      .then((r) => r.data),

  unblock: (id: string) =>
    api.post<PlatformOrganization>(`${ROOT}/${id}/unblock`).then((r) => r.data),

  /**
   * Direktor parolini tiklash. Javobdagi parol BIR MARTA keladi va
   * hech qayerda saqlanmaydi — yo'qotilsa amalni qaytadan bajarish
   * kerak.
   */
  resetDirectorPassword: (orgId: string, userId: string) =>
    api
      .post<{ temporaryPassword: string }>(
        `${ROOT}/${orgId}/directors/${userId}/reset-password`,
      )
      .then((r) => r.data),

  members: (id: string, query: PageQuery) =>
    api
      .get<Paginated<OrganizationMember>>(`${ROOT}/${id}/members`, {
        params: query,
      })
      .then((r) => r.data),

  /** Barcha tashkilotlarning stadionlari — platforma bo'limi uchun. */
  allVenues: (query: PlatformVenuesQuery) =>
    api
      .get<Paginated<PlatformVenue>>('/platform/venues', { params: query })
      .then((r) => r.data),

  venue: (id: string) =>
    api.get<PlatformVenueCard>(`/platform/venues/${id}`).then((r) => r.data),

  /** Arxivlangan stadionlar ham qaytadi — `stats.venueCount` bilan mos kelishi uchun. */
  venues: (id: string, query: PageQuery) =>
    api
      .get<Paginated<OrganizationVenue>>(`${ROOT}/${id}/venues`, {
        params: query,
      })
      .then((r) => r.data),
};
