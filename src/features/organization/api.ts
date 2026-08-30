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
  createdAt: string;
  updatedAt: string;
};

export const organizationApi = {
  /** Kirgan har bir foydalanuvchi uchun ochiq — ruxsat talab qilinmaydi. */
  current: () =>
    api.get<Organization>('/organizations/current').then((r) => r.data),
};
