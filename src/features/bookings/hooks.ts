import { useQuery } from '@tanstack/react-query';
import { bookingsApi, type BookingsQuery } from './api';

export const bookingKeys = {
  all: ['bookings'] as const,
  search: (query: BookingsQuery) => ['bookings', 'search', query] as const,
  todayPanel: ['bookings', 'today-panel'] as const,
};

export function useTodayPanel() {
  return useQuery({
    queryKey: bookingKeys.todayPanel,
    queryFn: bookingsApi.todayPanel,
  });
}

/**
 * Faqat SON kerak bo'lganda: `pageSize: 1` bilan so'raladi va javobdan
 * `total` olinadi. Yigirmata bronni yuklab, keyin tashlab yuborish
 * ma'nosiz — ko'rsatkich kartochkasiga bitta raqam kerak.
 */
export function useBookingCount(query: BookingsQuery) {
  const withSize: BookingsQuery = { ...query, page: 1, pageSize: 1 };
  return useQuery({
    queryKey: bookingKeys.search(withSize),
    queryFn: () => bookingsApi.search(withSize),
    select: (page) => page.total,
  });
}
