/**
 * Token persistence layer over localStorage.
 *
 * Access tokens live in memory via the auth store; refresh tokens are persisted
 * to localStorage so a page refresh can rehydrate the session. We also persist
 * the access token to keep the axios request interceptor simple across reloads.
 */

const ACCESS_KEY = 'exp.accessToken';
const REFRESH_KEY = 'exp.refreshToken';

export const tokenStorage = {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_KEY);
    } catch {
      return null;
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },

  setTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(ACCESS_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
    } catch {
      // localStorage may be unavailable (private mode); auth still works in-session.
    }
  },

  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      // noop
    }
  },
};
