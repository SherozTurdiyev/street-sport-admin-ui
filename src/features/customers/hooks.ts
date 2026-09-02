import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { customersApi, type CustomersQuery } from './api';

export const customerKeys = {
  all: ['customers'] as const,
  list: (query: CustomersQuery) => ['customers', 'list', query] as const,
  card: (id: string) => ['customers', 'card', id] as const,
};

/**
 * Qidiruv NATIJASI saqlanmaydi: `lookup` yangi mijoz yaratishi ham
 * mumkin, ya'ni u so'rov emas, amal.
 */
export function useCustomerLookup() {
  return useMutation({ mutationFn: customersApi.lookup });
}

export function useCustomers(query: CustomersQuery) {
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: () => customersApi.list(query),
    placeholderData: keepPreviousData,
  });
}
