import { useQuery } from '@tanstack/react-query';
import { bookingsApi, type BookingsQuery } from './api';

export const bookingKeys = {
  all: ['bookings'] as const,
  search: (query: BookingsQuery) => ['bookings', 'search', query] as const,
  todayPanel: ['bookings', 'today-panel'] as const,
  day: (date: string, venueId: string) =>
    ['bookings', 'day', date, venueId] as const,
};

/** Bitta stadionning bitta kuni — panjara va kunlik ko'rsatkichlar uchun. */
export function useDayCalendar(date: string, venueId: string) {
  return useQuery({
    queryKey: bookingKeys.day(date, venueId),
    queryFn: () => bookingsApi.calendarDay(date, [venueId]),
    select: (data) => ({
      from: data.from,
      to: data.to,
      venue: data.venues[0] ?? null,
    }),
  });
}

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
