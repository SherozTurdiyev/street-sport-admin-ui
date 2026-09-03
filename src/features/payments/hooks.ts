import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingKeys } from '@/features/bookings/hooks';
import { customerKeys } from '@/features/customers/hooks';
import { shiftKeys } from '@/features/shifts/hooks';
import {
  paymentsApi,
  type CreatePaymentInput,
  type CreateRefundInput,
} from './api';

export const paymentKeys = {
  all: ['payments'] as const,
  ofBooking: (bookingId: string) => ['payments', bookingId] as const,
};

export function usePayments(bookingId: string | null) {
  return useQuery({
    queryKey: paymentKeys.ofBooking(bookingId ?? ''),
    queryFn: () => paymentsApi.list(bookingId as string),
    enabled: bookingId !== null,
  });
}

/**
 * Bitta to'lov to'rt joydagi raqamni o'zgartiradi: bron balansi,
 * bronning o'zi (`debt`), mijoz kartochkasi va ochiq smena qoldig'i.
 * Ularning hammasi bekor qilinadi — aks holda ekranda eski son
 * qolib ketardi.
 */
function usePaymentAction<TInput>(
  bookingId: string,
  mutationFn: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.ofBooking(bookingId),
      });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all });
    },
  });
}

export function useAcceptPayment(bookingId: string) {
  return usePaymentAction(bookingId, (input: CreatePaymentInput) =>
    paymentsApi.accept(bookingId, input),
  );
}

export function useRefundPayment(bookingId: string) {
  return usePaymentAction(bookingId, (input: CreateRefundInput) =>
    paymentsApi.refund(bookingId, input),
  );
}
