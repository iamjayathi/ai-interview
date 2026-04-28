'use client';

interface ProgressProps {
  value: number;
  className?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'red';
  size?: 'sm' | 'md';
  animated?: boolean;
}

const colorMap = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
};

export function Progress({
  value,
  className = '',
  color = 'indigo',
  size = 'sm',
  animated = false,
}: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${height} ${className}`}>
      <div
        className={`${height} ${colorMap[color]} rounded-full transition-all duration-500 ${animated ? 'animate-pulse' : ''}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
