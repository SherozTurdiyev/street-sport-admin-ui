import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { bookingKeys } from '@/features/bookings/hooks';
import {
  seriesApi,
  type CancelSeriesInput,
  type CreateSeriesInput,
  type ExtendInput,
  type SeriesQuery,
} from './api';

export const seriesKeys = {
  all: ['series'] as const,
  list: (query: SeriesQuery) => ['series', 'list', query] as const,
  card: (id: string) => ['series', 'card', id] as const,
};

export function useSeriesList(query: SeriesQuery) {
  return useQuery({
    queryKey: seriesKeys.list(query),
    queryFn: () => seriesApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useSeries(id: string | null) {
  return useQuery({
    queryKey: seriesKeys.card(id ?? ''),
    queryFn: () => seriesApi.card(id as string),
    enabled: id !== null,
  });
}

/** Oldindan ko'rish hech narsa yaratmaydi, lekin so'rov emas — amal. */
export function useSeriesPreview() {
  return useMutation({ mutationFn: seriesApi.preview });
}

/**
 * Seriya amali BRONLARNI ham o'zgartiradi, shuning uchun ikkala shox
 * bekor qilinadi: kalendar seriyadan yaratilgan bronlarni darhol
 * ko'rsatishi kerak.
 */
function useSeriesAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: seriesKeys.all });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useCreateSeries() {
  return useSeriesAction((input: CreateSeriesInput) => seriesApi.create(input));
}

export function useExtendSeries(id: string) {
  return useSeriesAction((input: ExtendInput) => seriesApi.extend(id, input));
}

export function useCancelSeries(id: string) {
  return useSeriesAction((input: CancelSeriesInput) =>
    seriesApi.cancel(id, input),
  );
}
