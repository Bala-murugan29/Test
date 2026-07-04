import { useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  onTick?: (remaining: number) => void;
  onExpire?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  start: () => void;
  pause: () => void;
  reset: (seconds: number) => void;
}

export function useTimer({
  initialSeconds,
  onTick,
  onExpire,
  autoStart = true,
}: UseTimerOptions): UseTimerReturn {
  const remainingRef = useRef(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1;
      onTick?.(remainingRef.current);
      if (remainingRef.current <= 0) {
        stop();
        onExpire?.();
      }
    }, 1000);
  }, [onTick, onExpire, stop]);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  const reset = useCallback(
    (seconds: number) => {
      stop();
      remainingRef.current = seconds;
      onTick?.(seconds);
    },
    [stop, onTick]
  );

  useEffect(() => {
    remainingRef.current = initialSeconds;
    if (autoStart) start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { start, pause, reset };
}
