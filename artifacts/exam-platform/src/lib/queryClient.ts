import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance.
 *
 * Configured with reasonable defaults for an interactive exam platform:
 * - 2 retries on transient errors (skips 401/403/404)
 * - 30-second stale time (balances freshness vs. unnecessary refetches)
 * - No refetch-on-window-focus (avoids jarring data reloads mid-exam)
 * - 5-minute garbage collection for unused cache data
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        const status =
          (error as { status?: number })?.status ?? 0;
        // Don't retry auth or not-found errors.
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
});
