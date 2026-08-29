import type { PropsWithChildren } from 'react';
import { ConfigProvider } from 'antd';
import uzUZ from 'antd/locale/uz_UZ';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/errors';

/**
 * 4xx qayta so'ralmaydi: 403 uch marta ham 403 qaytaradi, foydalanuvchi
 * esa uch barobar kutadi. 5xx — vaqtinchalik bo'lishi mumkin, bir marta
 * urinib ko'riladi.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status < 500) return false;
          return failureCount < 1;
        },
      },
      mutations: { retry: false },
    },
  });
}

const queryClient = createQueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={uzUZ}>{children}</ConfigProvider>
    </QueryClientProvider>
  );
}
