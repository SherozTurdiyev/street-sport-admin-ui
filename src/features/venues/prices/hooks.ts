import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pricesApi, type PriceRuleInput } from './api';

export const priceKeys = {
  all: (venueId: string) => ['prices', venueId] as const,
  rules: (venueId: string) => ['prices', venueId, 'rules'] as const,
  table: (venueId: string) => ['prices', venueId, 'table'] as const,
};

export function usePriceRules(venueId: string) {
  return useQuery({
    queryKey: priceKeys.rules(venueId),
    queryFn: () => pricesApi.list(venueId),
  });
}

export function usePriceTable(venueId: string) {
  return useQuery({
    queryKey: priceKeys.table(venueId),
    queryFn: () => pricesApi.table(venueId),
  });
}

/**
 * Qoida o'zgarsa panjara ham qayta so'raladi: `priceKeys.all` prefiksi
 * ikkalasini ham qamrab oladi. Aks holda ro'yxatda yangi qoida turib,
 * panjara eski narxni ko'rsatardi.
 */
function usePriceAction<TInput, TOutput>(
  venueId: string,
  mutationFn: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: priceKeys.all(venueId) });
    },
  });
}

export function useCreatePriceRule(venueId: string) {
  return usePriceAction(venueId, (input: PriceRuleInput) =>
    pricesApi.create(venueId, input),
  );
}

export function useUpdatePriceRule(venueId: string, ruleId: string) {
  return usePriceAction(venueId, (input: Partial<PriceRuleInput>) =>
    pricesApi.update(venueId, ruleId, input),
  );
}

export function useDeletePriceRule(venueId: string) {
  return usePriceAction(venueId, (ruleId: string) =>
    pricesApi.remove(venueId, ruleId),
  );
}

/** Kalkulyator hech narsani o'zgartirmaydi — shuning uchun mutatsiya. */
export function useCalculatePrice(venueId: string) {
  return useMutation({
    mutationFn: (range: { startsAt: string; endsAt: string }) =>
      pricesApi.calculate(venueId, range.startsAt, range.endsAt),
  });
}
