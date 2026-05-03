import { createBrowserRouter, Outlet } from 'react-router';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { MainLayout } from './pages/MainLayout';
import InviteJoinPage from './pages/InviteJoinPage';
import MockupsPage from './pages/MockupsPage';
import { AppProvider, useApp } from './context/AppContext';

// Loading component
function LoadingPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#060c18]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06b6d4] mx-auto mb-4"></div>
        <p className="text-[#e2e8f0]">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useApp();
  
  if (isLoading) {
    return <LoadingPage />;
  }
  
  if (!currentUser) {
    return <LoginForm />;
  }
  
  return <>{children}</>;
}

// Wrapper component to provide context to all routes
function RootLayout() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

// Error component for routing errors
function ErrorPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#060c18]">
      <div className="text-center">
        <h1 className="text-2xl text-[#e2e8f0] mb-2">Something went wrong</h1>
        <p className="text-[#475569] mb-4">Please refresh the page</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <LoginForm />,
      },
      {
        path: '/login',
        element: <LoginForm />,
      },
      {
        path: '/register',
        element: <RegisterForm />,
      },
      {
        path: '/invite/:code',
        element: <InviteJoinPage />,
      },
      {
        path: '/channels',
        element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
      },
      {
        path: '/mockups',
        element: <ProtectedRoute><MockupsPage /></ProtectedRoute>,
      },
      {
        path: '*',
        element: <LoginForm />,
      },
    ],
  },
]);
