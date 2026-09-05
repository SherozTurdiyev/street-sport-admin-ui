import { api } from '@/shared/api/client';

export type Organization = {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  subscriptionStatus: string;
  subscriptionEndsAt: string | null;
  /**
   * F12.3 — shu summadan OSHGAN kassa farqi direktorga xabar qiladi.
   * Pul satr (BR-13). Nol — har qanday farq xabar qiladi.
   */
  cashMismatchThreshold: string;
  createdAt: string;
  updatedAt: string;
};

export const organizationApi = {
  /** Kirgan har bir foydalanuvchi uchun ochiq — ruxsat talab qilinmaydi. */
  current: () =>
    api.get<Organization>('/organizations/current').then((r) => r.data),

  /** `org.settings.update` ruxsatini talab qiladi. */
  update: (input: { cashMismatchThreshold: string }) =>
    api
      .patch<Organization>('/organizations/current', input)
      .then((r) => r.data),
};
