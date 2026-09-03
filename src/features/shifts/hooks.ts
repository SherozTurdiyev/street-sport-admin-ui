import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  shiftsApi,
  type CloseShiftInput,
  type OpenShiftInput,
  type ShiftsQuery,
} from './api';

export const shiftKeys = {
  all: ['shifts'] as const,
  list: (query: ShiftsQuery) => ['shifts', 'list', query] as const,
  current: (venueId: string) => ['shifts', 'current', venueId] as const,
  card: (id: string) => ['shifts', 'card', id] as const,
};

export function useShifts(query: ShiftsQuery) {
  return useQuery({
    queryKey: shiftKeys.list(query),
    queryFn: () => shiftsApi.list(query),
    placeholderData: keepPreviousData,
  });
}

/** `venueId` — `null` bo'lsa so'rov ketmaydi (stadion tanlanmagan). */
export function useCurrentShift(venueId: string | null) {
  return useQuery({
    queryKey: shiftKeys.current(venueId ?? ''),
    queryFn: () => shiftsApi.current(venueId as string),
    enabled: venueId !== null,
  });
}

export function useShift(id: string | null) {
  return useQuery({
    queryKey: shiftKeys.card(id ?? ''),
    queryFn: () => shiftsApi.card(id as string),
    enabled: id !== null,
  });
}

function useShiftAction<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all });
    },
  });
}

export function useOpenShift() {
  return useShiftAction((input: OpenShiftInput) => shiftsApi.open(input));
}

export function useCloseShift(id: string) {
  return useShiftAction((input: CloseShiftInput) => shiftsApi.close(id, input));
}
