import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
