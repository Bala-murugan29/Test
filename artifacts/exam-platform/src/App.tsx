import { useEffect } from 'react';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import { useAuth, connectAuthFailureHandler } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';

import LandingPage from '@/pages/landing/LandingPage';
import StudentLoginPage from '@/pages/auth/StudentLoginPage';
import FacultyLoginPage from '@/pages/auth/FacultyLoginPage';
import AdminLoginPage from '@/pages/auth/AdminLoginPage';

import StudentLayout from '@/pages/student/StudentLayout';
import FacultyLayout from '@/pages/faculty/FacultyLayout';
import AdminLayout from '@/pages/admin/AdminLayout';

import NotFound from '@/pages/not-found';

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

/** Bootstrap component — runs getMe once on app mount to validate session. */
function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { init } = useAuth();

  useEffect(() => {
    connectAuthFailureHandler();
    init();
  }, [init]);

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />

      {/* Auth — public */}
      <Route path="/login/student" component={StudentLoginPage} />
      <Route path="/login/faculty" component={FacultyLoginPage} />
      <Route path="/login/admin" component={AdminLoginPage} />

      {/* Student — protected */}
      <Route path="/student"><StudentLayout /></Route>
      <Route path="/student/*"><StudentLayout /></Route>

      {/* Faculty — protected */}
      <Route path="/faculty"><FacultyLayout /></Route>
      <Route path="/faculty/*"><FacultyLayout /></Route>

      {/* Admin — protected */}
      <Route path="/admin"><AdminLayout /></Route>
      <Route path="/admin/*"><AdminLayout /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeInitializer>
          <AuthBootstrap>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </AuthBootstrap>
        </ThemeInitializer>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
