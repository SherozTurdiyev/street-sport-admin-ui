import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { membersApi, type MemberRole, type MembersQuery } from './api';

export const memberKeys = {
  all: ['members'] as const,
  list: (query: MembersQuery) => ['members', 'list', query] as const,
  detail: (userId: string) => ['members', 'detail', userId] as const,
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

export function useMember(userId: string | null) {
  return useQuery({
    // `userId` yo'q bo'lsa kalit ham tuzilmaydi va so'rov ketmaydi:
    // kartochka yopiq turganda ma'lumot kerak emas.
    queryKey: memberKeys.detail(userId ?? ''),
    queryFn: () => membersApi.detail(userId as string),
    enabled: userId !== null,
  });
}

/**
 * Kartochkadagi barcha amallar bir xil ishlaydi: server javob bergach
 * ham ro'yxat, ham kartochka yangilanadi. `memberKeys.all` prefiksi
 * ikkalasini ham qamrab oladi.
 */
function useMemberAction<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useSetRole(userId: string) {
  return useMemberAction((role: MemberRole) =>
    membersApi.setRole(userId, role),
  );
}

export function useSetActive(userId: string) {
  return useMemberAction((isActive: boolean) =>
    membersApi.setActive(userId, isActive),
  );
}

/**
 * Stadion tomonidan biriktirish: xodim jadval qatoridan keladi, ya'ni
 * `userId` ni hook yaratilayotganda bilib bo'lmaydi.
 */
export function useAssignVenues() {
  return useMemberAction((input: { userId: string; venueIds: string[] }) =>
    membersApi.setVenues(input.userId, input.venueIds),
  );
}

export function useSetVenues(userId: string) {
  return useMemberAction((venueIds: string[]) =>
    membersApi.setVenues(userId, venueIds),
  );
}
