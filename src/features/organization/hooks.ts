import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from './api';

export const organizationKeys = {
  current: ['organization', 'current'] as const,
};

export function useOrganization() {
  return useQuery({
    queryKey: organizationKeys.current,
    queryFn: organizationApi.current,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: organizationApi.update,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.current,
      });
    },
  });
}
