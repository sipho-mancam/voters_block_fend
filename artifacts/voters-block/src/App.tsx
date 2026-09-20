import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

// Pages
import PublicVoting from '@/pages/home';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import NewPoll from '@/pages/new-poll';
import History from '@/pages/history';
import PollDetail from '@/pages/poll-detail';
import { ProtectedRoute } from '@/components/layout/protected-route';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={PublicVoting} />
        <Route path="/login" component={Login} />
        
        {/* Protected Routes */}
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/polls/new">
          <ProtectedRoute component={NewPoll} requireAdmin />
        </Route>
        <Route path="/history">
          <ProtectedRoute component={History} requireAdmin />
        </Route>
        <Route path="/polls/:id">
          <ProtectedRoute component={PollDetail} />
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
