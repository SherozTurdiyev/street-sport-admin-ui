import { BrowserRouter } from 'react-router';
import { Providers } from './app/providers';
import { AuthProvider } from './features/auth/AuthProvider';
import { MavzuSinxron } from './features/theme/MavzuSinxron';
import { AppRouter } from './app/router';

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AuthProvider>
          <MavzuSinxron />
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </Providers>
  );
}
