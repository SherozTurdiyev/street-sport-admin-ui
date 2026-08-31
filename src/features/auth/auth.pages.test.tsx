import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  DIRECTOR_ME,
  anonHandlers,
  authedHandlers,
} from '@/test/handlers';
import { setAccessToken } from '@/shared/api/token';
import { RequireAuth } from '@/app/guards/RequireAuth';
import { LoginPage } from './LoginPage';
import { ChangePasswordPage } from './ChangePasswordPage';

describe('Login sahifasi', () => {
  it('xato parolda backend xabarini ko`rsatadi', async () => {
    setAccessToken(null);
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          {
            code: 'AUTH_INVALID_CREDENTIALS',
            message: "Telefon raqami yoki parol noto'g'ri.",
          },
          { status: 401 },
        ),
      ),
    );
    renderApp(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Telefon'), '+998901110001');
    await userEvent.type(screen.getByLabelText('Parol'), 'xato');
    await userEvent.click(screen.getByRole('button', { name: 'Kirish' }));

    // Matn frontendda yozilmagan — u backenddan kelgan.
    expect(
      await screen.findByText("Telefon raqami yoki parol noto'g'ri."),
    ).toBeInTheDocument();
  });

  it('bloklangan hisob xabarini ham o`zgarishsiz ko`rsatadi', async () => {
    setAccessToken(null);
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          {
            code: 'AUTH_ACCOUNT_LOCKED',
            message:
              "Hisob vaqtincha bloklangan. Bir oz kutib, qaytadan urinib ko'ring.",
          },
          { status: 423 },
        ),
      ),
    );
    renderApp(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Telefon'), '+998901110001');
    await userEvent.type(screen.getByLabelText('Parol'), 'xato');
    await userEvent.click(screen.getByRole('button', { name: 'Kirish' }));

    expect(await screen.findByText(/vaqtincha bloklangan/)).toBeInTheDocument();
  });

  it('bo`sh maydonlar bilan so`rov yubormaydi', async () => {
    setAccessToken(null);
    let calls = 0;
    server.use(
      ...anonHandlers(),
      http.post(`${API}/auth/login`, () => {
        calls += 1;
        return HttpResponse.json({}, { status: 401 });
      }),
    );
    renderApp(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Kirish' }));

    expect(
      await screen.findByText('Telefon raqamini kiriting'),
    ).toBeInTheDocument();
    expect(calls).toBe(0);
  });
});

describe('Parol almashtirish majburiyati', () => {
  const routes = (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/members" element={<div>Xodimlar sahifasi</div>} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );

  it('vaqtinchalik parolli foydalanuvchi boshqa sahifaga o`ta olmaydi', async () => {
    setAccessToken(null);
    server.use(...authedHandlers({ ...DIRECTOR_ME, mustChangePassword: true }));
    renderApp(routes, { route: '/members' });

    expect(await screen.findByText('Parolni almashtiring')).toBeInTheDocument();
    expect(screen.queryByText('Xodimlar sahifasi')).not.toBeInTheDocument();
  });

  it('oddiy foydalanuvchi to`sib qo`yilmaydi', async () => {
    setAccessToken(null);
    server.use(...authedHandlers());
    renderApp(routes, { route: '/members' });

    expect(await screen.findByText('Xodimlar sahifasi')).toBeInTheDocument();
  });

  it('kirmagan foydalanuvchi login sahifasiga tushadi', async () => {
    setAccessToken(null);
    server.use(...anonHandlers());
    renderApp(routes, { route: '/members' });

    expect(await screen.findByLabelText('Telefon')).toBeInTheDocument();
  });

  it('parol almashgach barcha sessiyalar yopilgani aytiladi', async () => {
    setAccessToken(null);
    server.use(
      ...authedHandlers({ ...DIRECTOR_ME, mustChangePassword: true }),
      http.post(`${API}/auth/change-password`, () =>
        HttpResponse.json({ success: true }),
      ),
      http.post(`${API}/auth/logout`, () =>
        HttpResponse.json({ success: true }),
      ),
    );
    renderApp(routes, { route: '/change-password' });

    await userEvent.type(
      await screen.findByLabelText('Joriy parol'),
      'Vaqtinchalik1',
    );
    await userEvent.type(screen.getByLabelText('Yangi parol'), 'YangiParol123');
    await userEvent.type(
      screen.getByLabelText('Yangi parolni takrorlang'),
      'YangiParol123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText('Parol almashtirildi')).toBeInTheDocument();
    expect(screen.getByText(/sessiyalar yopildi/)).toBeInTheDocument();
  });

  it('parollar mos kelmasa so`rov yubormaydi', async () => {
    setAccessToken(null);
    let calls = 0;
    server.use(
      ...authedHandlers(),
      http.post(`${API}/auth/change-password`, () => {
        calls += 1;
        return HttpResponse.json({ success: true });
      }),
    );
    renderApp(routes, { route: '/change-password' });

    await userEvent.type(
      await screen.findByLabelText('Joriy parol'),
      'Parol123!',
    );
    await userEvent.type(screen.getByLabelText('Yangi parol'), 'YangiParol123');
    await userEvent.type(
      screen.getByLabelText('Yangi parolni takrorlang'),
      'Boshqacha123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText('Parollar mos kelmadi')).toBeInTheDocument();
    expect(calls).toBe(0);
  });
});
