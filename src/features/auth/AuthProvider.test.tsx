import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, ADMIN_ME, DIRECTOR_ME, anonHandlers, authedHandlers } from '@/test/handlers';
import { setAccessToken } from '@/shared/api/token';
import { useAuth, useCan } from './hooks';

function Probe() {
  const { status, me, login, logout } = useAuth();
  const can = useCan();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="name">{me?.fullName ?? '-'}</span>
      <span data-testid="can">{String(can('member.admin.manage'))}</span>
      <button onClick={() => void login('+998901110001', 'Parol123!')}>Kirish</button>
      <button onClick={() => void logout()}>Chiqish</button>
    </div>
  );
}

describe('Auth konteksti', () => {
  it('cookie saqlanib qolgan bo`lsa foydalanuvchi tizimda qoladi', async () => {
    // Sahifa yangilanishining aynan o'zi: token yo'q, cookie bor.
    setAccessToken(null);
    server.use(...authedHandlers());
    renderApp(<Probe />);

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authed'),
    );
    expect(screen.getByTestId('name')).toHaveTextContent('Anvar Direktorov');
  });

  it('cookie yo`q bo`lsa anon holatiga tushadi', async () => {
    setAccessToken(null);
    server.use(...anonHandlers());
    renderApp(<Probe />);

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anon'),
    );
  });

  it('boshlanishida `loading` bo`ladi — login sahifasi chaqnamaydi', () => {
    setAccessToken(null);
    server.use(...authedHandlers());
    renderApp(<Probe />);

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
  });

  it('login `permissions` ni /auth/me dan oladi', async () => {
    setAccessToken(null);
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          accessToken: 'yangi',
          user: { id: 'u-1', fullName: 'Anvar Direktorov', phone: '+998901110001', orgId: 'o-1', role: 'DIRECTOR', mustChangePassword: false },
        }),
      ),
      http.get(`${API}/auth/me`, () => HttpResponse.json(DIRECTOR_ME)),
    );
    renderApp(<Probe />);
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anon'),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Kirish' }));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authed'),
    );
    // Login javobida `permissions` yo'q — u faqat /auth/me dan keladi.
    expect(screen.getByTestId('can')).toHaveTextContent('true');
  });

  it('administratorda xodim boshqarish ruxsati yo`q', async () => {
    setAccessToken(null);
    server.use(...authedHandlers(ADMIN_ME));
    renderApp(<Probe />);

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authed'),
    );
    expect(screen.getByTestId('can')).toHaveTextContent('false');
  });

  it('server xato bersa ham chiqish sessiyani unutadi', async () => {
    setAccessToken(null);
    server.use(
      ...authedHandlers(),
      http.post(`${API}/auth/logout`, () =>
        HttpResponse.json({ code: 'INTERNAL' }, { status: 500 }),
      ),
    );
    renderApp(<Probe />);
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authed'),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Chiqish' }));

    // Aks holda foydalanuvchi "chiqdim" deb o'ylab, aslida tizimda qolardi.
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anon'),
    );
  });
});
