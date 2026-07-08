import { useCallback, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { toApiError } from '../lib/axios';
import { setAuthFailureHandler } from '../lib/axios';
import type { Role } from '../types';

/**
 * Primary auth hook consumed by pages, layouts, and guards.
 *
 * Manages the full lifecycle: login, register, logout, bootstrap
 * rehydration (getMe), and automatic refresh-on-401 wiring.
 */
export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const isAuthenticated = status === 'authenticated';

  // Prevent double init.
  const initDone = useRef(false);

  /**
   * Bootstrap: hydrate tokens from storage, then validate via /auth/me.
   * If validation fails (expired/revoked), try a refresh. If that also fails,
   * clear auth state. Should be called once in App on mount.
   */
  const init = useCallback(async () => {
    if (initDone.current) return;
    initDone.current = true;

    try {
      const me = await authService.getMe();
      setUser(me);
      // getMe succeeded — tokens are valid.
    } catch {
      // Tokens might be expired. Try refresh.
      const refreshToken = localStorage.getItem('exp.refreshToken');
      if (refreshToken) {
        try {
          const res = await authService.refreshToken(refreshToken);
          setAuth(res.user, res.accessToken, res.refreshToken);
          return;
        } catch {
          // Refresh failed — clear everything.
        }
      }
      // Don't clear auth if the user already logged in while getMe was in flight.
      const currentStatus = useAuthStore.getState().status;
      if (currentStatus !== 'authenticated') {
        clearAuth();
      }
    }
  }, [setUser, setAuth, clearAuth]);

  /** Login with email + password. Returns the auth response on success. */
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login(email, password);
      setAuth(res.user, res.accessToken, res.refreshToken);
      return res;
    },
    [setAuth],
  );

  /** Register a new account and auto-login. */
  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      role?: string;
    }) => {
      const res = await authService.register(data);
      setAuth(res.user, res.accessToken, res.refreshToken);
      return res;
    },
    [setAuth],
  );

  /** Logout — revoke refresh token server-side and clear local state. */
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('exp.refreshToken');
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Best-effort server logout; always clear locally.
    }
    clearAuth();
  }, [clearAuth]);

  return {
    status,
    isAuthenticated,
    role,
    user,
    init,
    login,
    register,
    logout,
    /** Kept for backward compat with login pages that previously used loginAs. */
    loginAs: (() => {
      // Intentionally a no-op — pages should call login(email, password).
      console.warn('[useAuth] loginAs() is deprecated. Use login(email, password).');
    }) as (role: Role) => void,
  };
}

/* -------------------------------------------------------------------------- */
/* Wire the global 401 → logout handler so the axios interceptor can          */
/* force-logout when refresh also fails.                                      */
/* -------------------------------------------------------------------------- */

let storeLogoutFn: (() => void) | null = null;

setAuthFailureHandler(() => {
  if (storeLogoutFn) storeLogoutFn();
});

// Called once in App bootstrap to connect the interceptor to the current store.
export function connectAuthFailureHandler() {
  storeLogoutFn = useAuthStore.getState().clearAuth;
}
