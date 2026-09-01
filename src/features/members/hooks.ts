import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { membersApi, type MembersQuery } from './api';

export const memberKeys = {
  all: ['members'] as const,
  list: (query: MembersQuery) => ['members', 'list', query] as const,
};

export function useMembers(query: MembersQuery) {
  return useQuery({
    queryKey: memberKeys.list(query),
    queryFn: () => membersApi.list(query),
    // Sahifa almashganda jadval bo'shab ketmaydi: eski natija yangisi
    // kelguncha turadi. Aks holda har bosishda jadval sakraydi.
    placeholderData: keepPreviousData,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: membersApi.create,
    // Optimistik yangilash ATAYLAB yo'q: telefon bandligi va ierarxiya
    // qoidalari faqat serverda tekshiriladi, klient natijani oldindan
    // bila olmaydi.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
