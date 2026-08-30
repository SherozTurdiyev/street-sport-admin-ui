import { useQuery } from '@tanstack/react-query';
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
