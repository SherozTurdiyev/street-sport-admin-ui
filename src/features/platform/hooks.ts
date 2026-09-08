import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { PageQuery } from '@/shared/api/types';
import {
  platformApi,
  type CreateOrganizationInput,
  type OrganizationsQuery,
  type PlatformVenuesQuery,
  type UpdateOrganizationInput,
} from './api';

export const platformKeys = {
  all: ['platform'] as const,
  list: (query: OrganizationsQuery) => ['platform', 'list', query] as const,
  detail: (id: string) => ['platform', 'detail', id] as const,
  members: (id: string, query: PageQuery) =>
    ['platform', 'members', id, query] as const,
  venues: (id: string, query: PageQuery) =>
    ['platform', 'venues', id, query] as const,
  allVenues: (query: PlatformVenuesQuery) =>
    ['platform', 'all-venues', query] as const,
  venue: (id: string) => ['platform', 'venue', id] as const,
};

export function useOrganizations(query: OrganizationsQuery) {
  return useQuery({
    queryKey: platformKeys.list(query),
    queryFn: () => platformApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useOrganization(id: string | null) {
  return useQuery({
    queryKey: platformKeys.detail(id ?? ''),
    queryFn: () => platformApi.detail(id as string),
    enabled: id !== null,
  });
}

export function useOrganizationMembers(id: string, query: PageQuery) {
  return useQuery({
    queryKey: platformKeys.members(id, query),
    queryFn: () => platformApi.members(id, query),
    placeholderData: keepPreviousData,
  });
}

export function usePlatformVenues(query: PlatformVenuesQuery) {
  return useQuery({
    queryKey: platformKeys.allVenues(query),
    queryFn: () => platformApi.allVenues(query),
    placeholderData: keepPreviousData,
  });
}

/**
 * `id` — `null` bo'lishi mumkin: yo'lakcha (breadcrumb) stadion
 * sahifasida bo'lmaganda ham chaqiriladi.
 */
export function usePlatformVenue(id: string | null) {
  return useQuery({
    queryKey: platformKeys.venue(id ?? ''),
    queryFn: () => platformApi.venue(id as string),
    enabled: id !== null,
  });
}

export function useOrganizationVenues(id: string, query: PageQuery) {
  return useQuery({
    queryKey: platformKeys.venues(id, query),
    queryFn: () => platformApi.venues(id, query),
    placeholderData: keepPreviousData,
  });
}

/**
 * Har bir o'zgartirish butun `platform` shoxini bekor qiladi: bloklash
 * ro'yxatdagi holatni ham, kartochkadagi statistikani ham o'zgartiradi.
 */
function usePlatformAction<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformKeys.all });
    },
  });
}

export function useCreateOrganization() {
  return usePlatformAction((input: CreateOrganizationInput) =>
    platformApi.create(input),
  );
}

export function useUpdateOrganization(id: string) {
  return usePlatformAction((input: UpdateOrganizationInput) =>
    platformApi.update(id, input),
  );
}

export function useBlockOrganization(id: string) {
  return usePlatformAction((reason: string) => platformApi.block(id, reason));
}

export function useUnblockOrganization(id: string) {
  // `void` kirish: `mutateAsync()` argumentsiz chaqiriladi.
  return usePlatformAction<void, unknown>(() => platformApi.unblock(id));
}

export function useResetDirectorPassword(orgId: string) {
  return usePlatformAction((userId: string) =>
    platformApi.resetDirectorPassword(orgId, userId),
  );
}
