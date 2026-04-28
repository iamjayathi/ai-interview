'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialTime: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

export function useTimer({ initialTime, onExpire, autoStart = false }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsed * 1000;
    setIsRunning(true);
  }, [elapsed]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clear();
  }, []);

  const reset = useCallback(
    (newTime?: number) => {
      clear();
      const t = newTime ?? initialTime;
      setTimeLeft(t);
      setElapsed(0);
      setIsRunning(false);
      startTimeRef.current = 0;
    },
    [initialTime]
  );

  useEffect(() => {
    if (!isRunning) {
      clear();
      return;
    }

    startTimeRef.current = startTimeRef.current || Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSec = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = Math.max(0, initialTime - elapsedSec);

      setElapsed(elapsedSec);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clear();
        setIsRunning(false);
        onExpire?.();
      }
    }, 250);

    return clear;
  }, [isRunning, initialTime, onExpire]);

  const percentage = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;
  const urgency = percentage <= 20 ? 'danger' : percentage <= 40 ? 'warn' : 'safe';

  return { timeLeft, elapsed, isRunning, percentage, urgency, start, pause, reset };
}
