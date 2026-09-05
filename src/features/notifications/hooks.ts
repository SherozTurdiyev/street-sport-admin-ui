import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHasOrg } from '@/features/auth/hooks';
import { notificationsApi, type NotificationsQuery } from './api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (query: NotificationsQuery) =>
    ['notifications', 'list', query] as const,
};

/**
 * Qo'ng'iroqcha ma'lumoti.
 *
 * `enabled: hasOrg` — platforma xodimida tashkilot yo'q va server
 * haqli ravishda so'rovni rad etardi.
 *
 * Bir daqiqada bir qayta so'raladi: bildirishnoma tez yetishi kerak,
 * lekin jonli ulanish (websocket) bitta panel uchun ortiqcha.
 */
export function useNotifications(query: NotificationsQuery = {}) {
  const hasOrg = useHasOrg();

  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => notificationsApi.list(query),
    enabled: hasOrg,
    refetchInterval: 60_000,
  });
}

function useNotificationAction<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkNotificationRead() {
  return useNotificationAction((id: string) => notificationsApi.markRead(id));
}

export function useMarkAllNotificationsRead() {
  return useNotificationAction(() => notificationsApi.markAllRead());
}
