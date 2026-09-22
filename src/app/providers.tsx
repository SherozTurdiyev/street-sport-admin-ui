import type { PropsWithChildren } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import uzUZ from 'antd/locale/uz_UZ';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/errors';
import { antdTheme } from '@/shared/theme/antd-theme';
import { MavzuProvider } from '@/features/theme/MavzuProvider';
import { useMavzu } from '@/features/theme/hooks';

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

/**
 * `App` — antd 6 da SHART: `App.useApp()` orqali olinadigan `message`
 * va `modal` shu konteksdan keladi. Usiz ular jimgina yo'qoladi —
 * komponent xato bermaydi, foydalanuvchi esa hech qanday tasdiq
 * ko'rmaydi.
 */
function AntdQobiq({ children }: PropsWithChildren) {
  const { rejim } = useMavzu();
  return (
    <ConfigProvider locale={uzUZ} theme={antdTheme(rejim)}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Mavzu `ConfigProvider` dan TASHQARIDA: antd mavzusi rejimga
          bog'liq, ya'ni rejim yuqorida turishi kerak. */}
      <MavzuProvider>
        <AntdQobiq>{children}</AntdQobiq>
      </MavzuProvider>
    </QueryClientProvider>
  );
}
