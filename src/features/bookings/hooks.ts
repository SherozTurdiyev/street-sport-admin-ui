import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  bookingsApi,
  type BookingResult,
  type BookingsQuery,
  type CancelBookingInput,
  type CreateBookingInput,
  type MoveBookingInput,
} from './api';

export const bookingKeys = {
  all: ['bookings'] as const,
  search: (query: BookingsQuery) => ['bookings', 'search', query] as const,
  todayPanel: ['bookings', 'today-panel'] as const,
  day: (date: string, venueId: string) =>
    ['bookings', 'day', date, venueId] as const,
  calendar: (date: string, venueIds: string[]) =>
    ['bookings', 'calendar', date, venueIds] as const,
  card: (id: string) => ['bookings', 'card', id] as const,
};

export function useBookings(query: BookingsQuery) {
  return useQuery({
    queryKey: bookingKeys.search(query),
    queryFn: () => bookingsApi.search(query),
    placeholderData: keepPreviousData,
  });
}

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

/**
 * Kalendar uchun: BARCHA ruxsat etilgan stadionlar bitta so'rovda.
 * `venueIds` bo'sh bo'lsa server o'zi hammasini beradi (BR-08 backendda).
 */
export function useDay(date: string, venueIds: string[]) {
  return useQuery({
    queryKey: bookingKeys.calendar(date, venueIds),
    queryFn: () =>
      bookingsApi.calendarDay(date, venueIds.length > 0 ? venueIds : undefined),
  });
}

/** `id` — `null` bo'lishi mumkin: kartochka yopiq turganda so'rov ketmaydi. */
export function useBookingCard(id: string | null) {
  return useQuery({
    queryKey: bookingKeys.card(id ?? ''),
    queryFn: () => bookingsApi.card(id as string),
    enabled: id !== null,
  });
}

/**
 * Har bir o'zgartirish butun `bookings` shoxini bekor qiladi: bitta bron
 * kalendarda ham, ro'yxatda ham, bugungi panelda ham ko'rinadi va
 * ularning qaysi biri ochiq turganini hook bilmaydi.
 */
function useBookingAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useCreateBooking() {
  return useBookingAction((input: CreateBookingInput) =>
    bookingsApi.create(input),
  );
}

export function useMoveBooking(id: string) {
  return useBookingAction((input: MoveBookingInput) =>
    bookingsApi.move(id, input),
  );
}

export function useCancelBooking(id: string) {
  return useBookingAction((input: CancelBookingInput) =>
    bookingsApi.cancel(id, input),
  );
}

export function useSetBookingResult(id: string) {
  return useBookingAction((result: BookingResult) =>
    bookingsApi.setResult(id, result),
  );
}
