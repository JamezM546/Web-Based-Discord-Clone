import { createBrowserRouter } from 'react-router';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { MainLayout } from './pages/MainLayout';
import { AppProvider } from './context/AppContext';

// Wrapper component to provide context to all routes
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return <AppProvider>{children}</AppProvider>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RootLayout>
        <LoginForm />
      </RootLayout>
    ),
  },
  {
    path: '/login',
    element: (
      <RootLayout>
        <LoginForm />
      </RootLayout>
    ),
  },
  {
    path: '/register',
    element: (
      <RootLayout>
        <RegisterForm />
      </RootLayout>
    ),
  },
  {
    path: '/channels',
    element: (
      <RootLayout>
        <MainLayout />
      </RootLayout>
    ),
  },
  {
    path: '*',
    element: (
      <RootLayout>
        <LoginForm />
      </RootLayout>
    ),
  },
]);
