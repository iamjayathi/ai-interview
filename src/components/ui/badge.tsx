'use client';

const VARIANT_STYLES: Record<string, string> = {
  default:      'bg-slate-700/60 text-slate-300 border-slate-600/40',
  technical:    'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  behavioral:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  situational:  'bg-amber-500/15 text-amber-300 border-amber-500/25',
  cultural:     'bg-pink-500/15 text-pink-300 border-pink-500/25',
  resume:       'bg-slate-700/60 text-slate-300 border-slate-600/40',
  dsa:          'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  lld:          'bg-violet-500/15 text-violet-300 border-violet-500/25',
  hld:          'bg-blue-500/15 text-blue-300 border-blue-500/25',
  product_sense:'bg-pink-500/15 text-pink-300 border-pink-500/25',
  metrics:      'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  case_study:   'bg-orange-500/15 text-orange-300 border-orange-500/25',
  sql:          'bg-teal-500/15 text-teal-300 border-teal-500/25',
  statistics:   'bg-amber-500/15 text-amber-300 border-amber-500/25',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const style = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {children}
    </span>
  );
}
