import { BrowserRouter } from 'react-router';
import { Providers } from './app/providers';
import { AuthProvider } from './features/auth/AuthProvider';
import { AppRouter } from './app/router';

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </Providers>
  );
}
