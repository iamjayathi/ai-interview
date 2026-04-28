'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export function Card({ children, className = '', glass = false }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-slate-800/60
        ${glass ? 'glass' : 'bg-slate-900/80'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
