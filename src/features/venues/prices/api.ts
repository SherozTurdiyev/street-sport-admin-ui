import { api } from '@/shared/api/client';

/**
 * Narx qoidalar to'plami bilan belgilanadi: har biri "qachon qancha"
 * degan savolga javob beradi. Bir vaqtga bir nechta qoida mos kelsa,
 * `priority` yuqorisi yutadi.
 *
 * Har bir stadionda AYNAN BITTA bazaviy qoida (`isBase`) bo'lishi shart.
 * Usiz bron umuman yaratilmaydi (`PRICE_BASE_RULE_MISSING`).
 */
export type PriceRule = {
  id: string;
  venueId: string;
  name: string | null;
  isBase: boolean;
  /** 1–7, dushanba = 1. Bo'sh massiv — barcha kunlar. */
  weekdays: number[];
  /** `HH:mm`, Toshkent vaqti. `null` — butun kun. */
  startsTime: string | null;
  endsTime: string | null;
  /** So'm, SATR ko'rinishida (BR-13). */
  pricePerHour: string;
  /** `YYYY-MM-DD`, mavsumiy narx uchun. */
  validFrom: string | null;
  validTo: string | null;
  priority: number;
};

export type PriceRuleInput = {
  name?: string;
  isBase?: boolean;
  weekdays?: number[];
  startsTime?: string;
  endsTime?: string;
  pricePerHour: string;
  validFrom?: string;
  validTo?: string;
  priority?: number;
};

export type PriceSegment = {
  from: string;
  to: string;
  minutes: number;
  pricePerHour: string;
  price: string;
  ruleId: string;
  ruleName: string;
};

/**
 * Bron narx zonalari chegarasidan o'tsa segmentlarga bo'linadi va har
 * biri o'z tarifi bilan hisoblanadi. Segmentlarni ko'rsatish "nega
 * shuncha?" degan savolga javob beradi.
 */
export type PriceCalculation = {
  totalPrice: string;
  segments: PriceSegment[];
};

export type PriceTableHour = {
  /** Toshkent mahalliy soati, 0–23. */
  hour: number;
  pricePerHour: string;
  ruleId: string;
  ruleName: string;
};

export type PriceTable = {
  venueId: string;
  days: { weekday: number; hours: PriceTableHour[] }[];
};

const root = (venueId: string) => `/venues/${venueId}/price-rules`;

export const pricesApi = {
  /** Sahifalanmaydi — qoidalar kam bo'ladi. */
  list: (venueId: string) =>
    api.get<PriceRule[]>(root(venueId)).then((r) => r.data),

  create: (venueId: string, input: PriceRuleInput) =>
    api.post<PriceRule>(root(venueId), input).then((r) => r.data),

  update: (venueId: string, ruleId: string, input: Partial<PriceRuleInput>) =>
    api
      .patch<PriceRule>(`${root(venueId)}/${ruleId}`, input)
      .then((r) => r.data),

  remove: (venueId: string, ruleId: string) =>
    api
      .delete<{ id: string }>(`${root(venueId)}/${ruleId}`)
      .then((r) => r.data),

  calculate: (venueId: string, startsAt: string, endsAt: string) =>
    api
      .post<PriceCalculation>(`${root(venueId)}/calculate`, {
        startsAt,
        endsAt,
      })
      .then((r) => r.data),

  table: (venueId: string) =>
    api.get<PriceTable>(`${root(venueId)}/table`).then((r) => r.data),
};
