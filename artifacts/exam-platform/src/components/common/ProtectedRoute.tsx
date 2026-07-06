import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
  /** Path to redirect to if not authenticated (defaults to /login/<first-allowed-role>). */
  loginPath?: string;
}

/**
 * Route guard for role-protected pages.
 *
 * - Unauthenticated → redirect to login
 * - Authenticated but wrong role → redirect to the user's own dashboard
 * - Authenticated + correct role → render children
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  loginPath,
}: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const [, setLocation] = useLocation();

  // Still hydrating (tokens in storage, getMe in flight).
  const isHydrating =
    !isAuthenticated && localStorage.getItem('exp.accessToken');

  if (isHydrating) {
    return null; // Let the bootstrap finish before rendering anything.
  }

  if (!isAuthenticated || !role) {
    // Redirect to the login page for the first allowed role.
    const fallback = loginPath ?? `/login/${allowedRoles[0]}`;
    // Avoid infinite redirect loops.
    if (window.location.pathname !== fallback) {
      setLocation(fallback);
    }
    return null;
  }

  if (!allowedRoles.includes(role)) {
    // Wrong role → redirect to this user's dashboard.
    const dash = `/${role}/dashboard`;
    if (window.location.pathname !== dash) {
      setLocation(dash);
    }
    return null;
  }

  return <>{children}</>;
}
