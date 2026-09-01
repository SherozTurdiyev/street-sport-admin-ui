import { useQuery } from '@tanstack/react-query';
import { venuesApi } from './api';

export const venueKeys = {
  options: ['venues', 'options'] as const,
};

/**
 * `enabled` — ro'yxat faqat kerak bo'lganda so'raladi: menejer
 * yaratayotgan foydalanuvchiga stadionlar kerak emas.
 */
export function useVenueOptions(enabled: boolean) {
  return useQuery({
    queryKey: venueKeys.options,
    queryFn: venuesApi.options,
    enabled,
    // Stadion ro'yxati kamdan-kam o'zgaradi.
    staleTime: 5 * 60_000,
  });
}
