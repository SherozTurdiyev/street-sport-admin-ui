import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCan } from '@/features/auth/hooks';
import {
  demoRequestsApi,
  type DemoRequestsQuery,
  type UpdateDemoRequestInput,
} from './api';

export const demoRequestKeys = {
  all: ['demo-requests'] as const,
  list: (query: DemoRequestsQuery) => ['demo-requests', 'list', query] as const,
  newCount: ['demo-requests', 'new-count'] as const,
};

export function useDemoRequests(query: DemoRequestsQuery) {
  return useQuery({
    queryKey: demoRequestKeys.list(query),
    queryFn: () => demoRequestsApi.list(query),
    placeholderData: keepPreviousData,
  });
}

/**
 * Menyudagi belgi uchun ishlanmagan murojaatlar soni.
 *
 * Alohida endpoint YO'Q: mavjud ro'yxat `pageSize: 1` bilan
 * so'raladi va faqat `total` olinadi. Bitta son uchun backendga
 * yangi yo'l qo'shish ortiqcha bo'lardi.
 */
export function useNewDemoRequestCount() {
  const can = useCan();
  const ruxsat = can('platform.org.manage');

  const { data } = useQuery({
    queryKey: demoRequestKeys.newCount,
    queryFn: () => demoRequestsApi.list({ status: 'NEW', pageSize: 1 }),
    // Ruxsati yo'q foydalanuvchi bu so'rovni umuman yubormaydi —
    // backend haqli ravishda 403 qaytarardi.
    enabled: ruxsat,
    staleTime: 60_000,
  });

  return data?.total ?? 0;
}

export function useUpdateDemoRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateDemoRequestInput;
    }) => demoRequestsApi.update(id, input),
    onSuccess: () => {
      // Ro'yxat ham, menyudagi belgi ham yangilanadi: holat
      // o'zgarganda son ham o'zgarishi kerak.
      void qc.invalidateQueries({ queryKey: demoRequestKeys.all });
    },
  });
}
