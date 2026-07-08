import { create } from 'zustand';
import type { Role } from '../types';
import { tokenStorage } from '../lib/token-storage';
import type { UserResponse } from '../services/auth.service';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
}

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  role: Role | null;
  /** Hydrate tokens + user from storage (called once on app bootstrap). */
  hydrate: () => Promise<void>;
  /** Called after a successful login / register / refresh. */
  setAuth: (
    user: UserResponse,
    accessToken: string,
    refreshToken: string,
  ) => void;
  /** Update the user object (e.g. after getMe). */
  setUser: (user: UserResponse) => void;
  /** Clear all auth state + storage. */
  clearAuth: () => void;
}

/* -------------------------------------------------------------------------- */
/* Mapper — backend UserResponse → frontend AuthUser                          */
/* -------------------------------------------------------------------------- */

function mapUser(u: UserResponse): AuthUser {
  // Derive a primary role from the roles array (first match).
  const roleOrder: Role[] = ['admin', 'faculty', 'student'];
  const primary = (u.roles.find((r) => roleOrder.includes(r as Role)) ?? 'student') as Role;

  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: primary,
    department: '', // Not in backend UserResponse; populated if available.
  };
}

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  user: null,
  role: null,

  hydrate: async () => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    if (!accessToken || !refreshToken) {
      set({ status: 'unauthenticated', user: null, role: null });
      return;
    }
    // Tokens exist in storage — mark as potentially authenticated.
    // The caller (useAuth bootstrap) will call getMe to validate; if that
    // fails it will call clearAuth(). We optimistically restore role/user
    // from the stored token payload so the UI can render immediately.
    set({ status: 'authenticated' });
    // Actual validation happens in useAuth.init().
  },

  setAuth: (userResponse, accessToken, refreshToken) => {
    const user = mapUser(userResponse);
    tokenStorage.setTokens(accessToken, refreshToken);
    set({ status: 'authenticated', user, role: user.role });
  },

  setUser: (userResponse) => {
    const user = mapUser(userResponse);
    set({ status: 'authenticated', user, role: user.role });
  },

  clearAuth: () => {
    tokenStorage.clearTokens();
    set({ status: 'unauthenticated', user: null, role: null });
  },
}));
