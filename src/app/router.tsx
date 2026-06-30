import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import AuthLayout from '@/layouts/AuthLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import HousesPage from '@/pages/dashboard/HousesPage';
import BatchesPage from '@/pages/dashboard/BatchesPage';
import DailyRecordsPage from '@/pages/dashboard/production/DailyRecordsPage';
import EggProductionPage from '@/pages/dashboard/production/EggProductionPage';
import FeedManagementPage from '@/pages/dashboard/feed/FeedManagementPage';
import InventoryPage from '@/pages/dashboard/inventory/InventoryPage';
import HealthPage from '@/pages/dashboard/health/HealthPage';
import FinancePage from '@/pages/dashboard/finance/FinancePage';
import ReportsPage from '@/pages/dashboard/ReportsPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import AiAssistantPage from '@/pages/dashboard/AiAssistantPage';
import AiReportsPage from '@/pages/dashboard/AiReportsPage';
import GuidePage from '@/pages/dashboard/GuidePage';
import { useAuthStore } from '@/store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'houses', element: <HousesPage /> },
      { path: 'batches', element: <BatchesPage /> },
      { path: 'daily-records', element: <DailyRecordsPage /> },
      { path: 'egg-production', element: <EggProductionPage /> },
      { path: 'feed', element: <FeedManagementPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'health', element: <HealthPage initialTab="treatments" /> },
      { path: 'vaccination', element: <HealthPage initialTab="vaccines" /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'ai-assistant', element: <AiAssistantPage /> },
      { path: 'ai-reports', element: <AiReportsPage /> },
      { path: 'guide', element: <GuidePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ]
  },
  {
    path: '/auth',
    element: <PublicRoute><AuthLayout /></PublicRoute>,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
