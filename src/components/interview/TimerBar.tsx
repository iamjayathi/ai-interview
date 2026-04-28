'use client';

import { useTimer } from '@/hooks/useTimer';
import { useEffect } from 'react';

interface TimerBarProps {
  timeLimit: number;
  isActive: boolean;
  onExpire: () => void;
  onReset?: (fn: () => void) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

export function TimerBar({ timeLimit, isActive, onExpire, onReset }: TimerBarProps) {
  const { timeLeft, percentage, urgency, start, pause, reset } = useTimer({
    initialTime: timeLimit,
    onExpire,
  });

  useEffect(() => {
    if (isActive) {
      reset(timeLimit);
      start();
    } else {
      pause();
    }
  }, [isActive, timeLimit]);

  useEffect(() => {
    onReset?.(() => {
      reset(timeLimit);
    });
  }, [onReset, reset, timeLimit]);

  const colorClass =
    urgency === 'danger'
      ? 'text-red-400'
      : urgency === 'warn'
      ? 'text-amber-400'
      : 'text-emerald-400';

  const barColor =
    urgency === 'danger'
      ? 'bg-red-400'
      : urgency === 'warn'
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg
            className={`w-3.5 h-3.5 ${colorClass} ${urgency === 'danger' ? 'animate-pulse' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-xs font-mono font-bold ${colorClass}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <span className="text-xs text-slate-600">Pressure Mode</span>
      </div>

      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor} ${urgency === 'danger' ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
