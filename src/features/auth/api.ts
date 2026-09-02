import { api } from '@/shared/api/client';
import type { Role } from '@/shared/api/types';

export type Me = {
  userId: string;
  orgId: string | null;
  role: Role;
  fullName: string;
  phone: string;
  mustChangePassword: boolean;
  permissions: string[];
};

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    orgId: string | null;
    role: Role;
    mustChangePassword: boolean;
  };
};

export const authApi = {
  login: (phone: string, password: string) =>
    api
      .post<LoginResponse>('/auth/login', { phone, password })
      .then((r) => r.data),

  me: () => api.get<Me>('/auth/me').then((r) => r.data),

  logout: () => api.post('/auth/logout').then(() => undefined),

  /** Barcha qurilmalardagi sessiyalarni yopadi. */
  logoutAll: () => api.post('/auth/logout-all').then(() => undefined),

  changePassword: (currentPassword: string, newPassword: string) =>
    api
      .post('/auth/change-password', { currentPassword, newPassword })
      .then(() => undefined),
};
