import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './app/router';
import { Toaster } from '@/components/ui/sonner';
import { useAuthListener } from '@/features/auth/hooks/useAuthListener';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient();

function AppContent() {
  useAuthListener();
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading PoultryPro...</div>;
  }

  return <AppRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

