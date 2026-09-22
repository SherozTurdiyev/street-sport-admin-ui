import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import uzUZ from 'antd/locale/uz_UZ';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { antdTheme } from '@/shared/theme/antd-theme';
import { MavzuProvider } from '@/features/theme/MavzuProvider';

/**
 * Har bir test o'z `QueryClient` iga ega: kesh testlar orasida oqib
 * ketmasligi kerak. `retry: false` — testda qayta urinish faqat vaqt
 * yo'qotadi va xato sababini yashiradi.
 */
function createTestClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderApp(
  ui: ReactElement,
  options: RenderOptions & { route?: string } = {},
) {
  const { route = '/', ...rest } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={createTestClient()}>
        {/* Testlarda rejim qat'iy `dark`: mavjud testlar ko'rinishga
            emas, xulq-atvorga qaraydi. Mavzu testlari o'z tekshiruvini
            `data-theme` orqali qiladi. */}
        <MavzuProvider>
          <ConfigProvider locale={uzUZ} theme={antdTheme('dark')}>
            <AntApp>
              <MemoryRouter initialEntries={[route]}>
                <AuthProvider>{children}</AuthProvider>
              </MemoryRouter>
            </AntApp>
          </ConfigProvider>
        </MavzuProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rest });
}
