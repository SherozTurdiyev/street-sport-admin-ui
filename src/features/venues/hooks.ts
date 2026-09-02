import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  venuesApi,
  type ClosureInput,
  type VenueHours,
  type VenueInput,
  type VenuesQuery,
} from './api';

export const venueKeys = {
  all: ['venues'] as const,
  options: ['venues', 'options'] as const,
  list: (query: VenuesQuery) => ['venues', 'list', query] as const,
  detail: (id: string) => ['venues', 'detail', id] as const,
  hours: (id: string) => ['venues', 'hours', id] as const,
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
    staleTime: 5 * 60_000,
  });
}

export function useVenues(query: VenuesQuery) {
  return useQuery({
    queryKey: venueKeys.list(query),
    queryFn: () => venuesApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useVenue(id: string | null) {
  return useQuery({
    queryKey: venueKeys.detail(id ?? ''),
    queryFn: () => venuesApi.detail(id as string),
    enabled: id !== null,
  });
}

export function useVenueHours(id: string) {
  return useQuery({
    queryKey: venueKeys.hours(id),
    queryFn: () => venuesApi.hours(id),
  });
}

function useVenueAction<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
  });
}

export function useCreateVenue() {
  return useVenueAction((input: VenueInput) => venuesApi.create(input));
}

export function useUpdateVenue(id: string) {
  return useVenueAction((input: Partial<VenueInput>) =>
    venuesApi.update(id, input),
  );
}

export function useArchiveVenue(id: string) {
  return useVenueAction((confirm: boolean) => venuesApi.archive(id, confirm));
}

export function useRestoreVenue(id: string) {
  return useVenueAction<void, unknown>(() => venuesApi.restore(id));
}

export function useSetVenueHours(id: string) {
  return useVenueAction((hours: VenueHours[]) => venuesApi.setHours(id, hours));
}

export function useAddPhoto(id: string) {
  return useVenueAction((file: File) => venuesApi.addPhoto(id, file));
}

export function useRemovePhoto(id: string) {
  return useVenueAction((photoId: string) =>
    venuesApi.removePhoto(id, photoId),
  );
}

export function useAddClosure(id: string) {
  return useVenueAction((input: ClosureInput) =>
    venuesApi.addClosure(id, input),
  );
}

export function useRemoveClosure(id: string) {
  return useVenueAction((closureId: string) =>
    venuesApi.removeClosure(id, closureId),
  );
}
