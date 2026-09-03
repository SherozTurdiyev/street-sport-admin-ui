import { api } from '@/shared/api/client';

/**
 * To'lov yozuvi O'CHIRILMAYDI va TAHRIRLANMAYDI — backendda `DELETE`
 * ham, `PATCH` ham yo'q. Xato to'lov qaytarish bilan tuzatiladi va
 * ikkala yozuv ham tarixda qoladi. Shuning uchun bu yerda ham faqat
 * ikkita yozuv amali bor: qabul qilish va qaytarish.
 */

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Naqd',
  CARD: 'Karta',
  TRANSFER: 'O‘tkazma',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD_LABELS;

export const PAYMENT_METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

export type PaymentType = 'PAYMENT' | 'REFUND';

export type Payment = {
  id: string;
  bookingId: string;
  /** Pul SATR (BR-13). */
  amount: string;
  method: PaymentMethod;
  type: PaymentType;
  shiftId: string | null;
  receivedBy: string | null;
  receiverName: string | null;
  reason: string | null;
  /** Qaytarish qaysi to'lovni bekor qilyapti. */
  reversesPaymentId: string | null;
  paidAt: string;
};

/**
 * Balans har safar to'lovlardan yig'iladi, bronda saqlanmaydi:
 * ```
 * paid = Σ(PAYMENT) − Σ(REFUND)
 * debt = priceTotal − discount − paid
 * ```
 */
export type BookingBalance = {
  priceTotal: string;
  discount: string;
  paid: string;
  refunded: string;
  debt: string;
};

export type PaymentsResponse = {
  items: Payment[];
  balance: BookingBalance;
};

export type CreatePaymentInput = {
  amount: string;
  method: PaymentMethod;
  reason?: string;
};

/** Sabab MAJBURIY: qaytarish suiiste'molning eng oson yo'li. */
export type CreateRefundInput = {
  amount: string;
  method: PaymentMethod;
  reason: string;
  reversesPaymentId?: string;
};

export const paymentsApi = {
  list: (bookingId: string) =>
    api
      .get<PaymentsResponse>(`/bookings/${bookingId}/payments`)
      .then((r) => r.data),

  accept: (bookingId: string, input: CreatePaymentInput) =>
    api
      .post<Payment>(`/bookings/${bookingId}/payments`, input)
      .then((r) => r.data),

  refund: (bookingId: string, input: CreateRefundInput) =>
    api
      .post<Payment>(`/bookings/${bookingId}/refunds`, input)
      .then((r) => r.data),
};
