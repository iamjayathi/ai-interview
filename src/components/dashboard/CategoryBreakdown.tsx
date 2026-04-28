'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { RoundType } from '@/lib/types';
import { ROUND_META } from '@/lib/interview-config';

interface CategoryBreakdownProps {
  roundScores: Partial<Record<RoundType, number>>;
}

const ROUND_COLORS: Partial<Record<RoundType, string>> = {
  resume:       '#94a3b8',
  dsa:          '#818cf8',
  lld:          '#a78bfa',
  hld:          '#60a5fa',
  behavioral:   '#34d399',
  product_sense:'#f472b6',
  metrics:      '#22d3ee',
  case_study:   '#fb923c',
  sql:          '#2dd4bf',
  statistics:   '#fbbf24',
};

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass px-3 py-2 rounded-xl border border-slate-700/60 text-sm">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className="font-bold text-slate-200">{payload[0].value}/100</p>
      </div>
    );
  }
  return null;
}

export function CategoryBreakdown({ roundScores }: CategoryBreakdownProps) {
  const data = (Object.entries(roundScores) as [RoundType, number][])
    .filter(([, score]) => score != null && score > 0)
    .map(([round, score]) => ({
      category: ROUND_META[round]?.shortName ?? round,
      score,
      key: round,
    }));

  if (data.length === 0) {
    return <p className="text-slate-600 text-sm text-center py-8">No round data yet</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="category" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={ROUND_COLORS[entry.key as RoundType] ?? '#818cf8'} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
