import { api } from '@/shared/api/client';
import type { Paginated } from '@/shared/api/types';

/**
 * M12 — bildirishnomalar. Ular SHAXSIY: server har doim faqat
 * kirgan foydalanuvchining yozuvlarini qaytaradi, shuning uchun
 * so'rovda `userId` yo'q.
 */
export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  /** Turga qarab har xil: `{ shiftId }`, `{ seriesId }`, `{ userId }`. */
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationList = Paginated<AppNotification> & {
  /** Sahifadan emas, butun ro'yxatdan — qo'ng'iroqcha shuni ko'rsatadi. */
  unreadCount: number;
};

export type NotificationsQuery = {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export const notificationsApi = {
  list: (query: NotificationsQuery = {}) =>
    api
      .get<NotificationList>('/notifications', { params: query })
      .then((r) => r.data),

  markRead: (id: string) =>
    api
      .patch<{ unreadCount: number }>(`/notifications/${id}/read`)
      .then((r) => r.data),

  markAllRead: () =>
    api
      .post<{ unreadCount: number }>('/notifications/read-all')
      .then((r) => r.data),
};
