import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  customersApi,
  type CreateCustomerInput,
  type CustomerInput,
  type CustomersQuery,
} from './api';

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

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: customerKeys.card(id ?? ''),
    queryFn: () => customersApi.card(id as string),
    enabled: id !== null,
  });
}

/**
 * Har bir o'zgartirish butun `customers` shoxini bekor qiladi: mijoz
 * ro'yxatda ham, kartochkada ham ko'rinadi.
 */
function useCustomerAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useCreateCustomer() {
  return useCustomerAction((input: CreateCustomerInput) =>
    customersApi.create(input),
  );
}

export function useUpdateCustomer(id: string) {
  return useCustomerAction((input: CustomerInput) =>
    customersApi.update(id, input),
  );
}

export function useSetBlacklist(id: string) {
  return useCustomerAction((isBlacklisted: boolean) =>
    customersApi.blacklist(id, isBlacklisted),
  );
}
