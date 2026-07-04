import { useAuthStore } from '../store/auth.store';
import { Role } from '../types';

export function useAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const loginAs = (r: Role) => login(r);

  return { isAuthenticated, role, user, loginAs, logout };
}
