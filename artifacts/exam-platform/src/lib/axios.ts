import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from './token-storage';

/**
 * Backend base URL.
 *
 * Vite exposes VITE_* env vars to the client. We strip a trailing slash so
 * endpoints can be written as `/auth/login` (without `/api` — it's added here).
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Session cookies aren't used — auth is bearer-token based. Long timeout so
  // exam submit / code-run have headroom.
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

/* -------------------------------------------------------------------------- */
/* Error normalization                                                        */
/* -------------------------------------------------------------------------- */

export interface ApiErrorResponse {
  message: string;
  status: number;
  requestId?: string;
  /** Raw backend body, if any. */
  details?: unknown;
}

/** Pull a human-readable message out of any error (axios or thrown). */
export function toApiError(err: unknown): ApiErrorResponse {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ error?: string; message?: string; requestId?: string }>;
    const data = axiosErr.response?.data;
    const message =
      data?.error ||
      data?.message ||
      axiosErr.message ||
      'Something went wrong. Please try again.';
    return {
      message,
      status: axiosErr.response?.status ?? 0,
      requestId: data?.requestId,
      details: data,
    };
  }
  if (err instanceof Error) {
    return { message: err.message, status: 0 };
  }
  return { message: 'An unexpected error occurred.', status: 0 };
}

/* -------------------------------------------------------------------------- */
/* Request interceptor — attach access token                                  */
/* -------------------------------------------------------------------------- */

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* -------------------------------------------------------------------------- */
/* Response interceptor — refresh-on-401 with single-flight queue             */
/* -------------------------------------------------------------------------- */

type PendingResolver = (token: string | null) => void;

let isRefreshing = false;
let pendingQueue: PendingResolver[] = [];

function subscribePending(resolver: PendingResolver) {
  pendingQueue.push(resolver);
}

function resolvePending(token: string | null) {
  pendingQueue.forEach((resolver) => resolver(token));
  pendingQueue = [];
}

/** Delegate back to the app to clear store + redirect. Set by App bootstrap. */
export let onAuthFailure: () => void = () => {};

export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    // Use the bare axios instance to bypass our interceptors (avoids recursion).
    const res = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

function shouldRetry(config: (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined): boolean {
  // Don't infinite-loop on the refresh endpoint itself.
  if (config?.url?.includes('/auth/refresh')) return false;
  if (config?._retried) return false;
  return true;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const status = error.response?.status;

    // 401 on a protected route → try to refresh once, then retry the original.
    if (status === 401 && original && shouldRetry(original)) {
      original._retried = true;

      // Single-flight: if a refresh is already in-flight, wait for it.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribePending((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            original.headers!.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshTokens();
        resolvePending(newToken);
        if (!newToken) {
          onAuthFailure();
          return Promise.reject(error);
        }
        original.headers!.Authorization = `Bearer ${newToken}`;
        return api(original);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/* -------------------------------------------------------------------------- */
/* Typed request helpers                                                      */
/* -------------------------------------------------------------------------- */

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<T>(url, config);
  return res.data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.post<T>(url, data, config);
  return res.data;
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.put<T>(url, data, config);
  return res.data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<T>(url, config);
  return res.data;
}
