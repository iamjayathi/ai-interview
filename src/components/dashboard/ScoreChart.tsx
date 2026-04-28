'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ScoreChartProps {
  scores: number[];
  difficulties: number[];
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass px-3 py-2 rounded-xl border border-slate-700/60 text-sm">
        <p className="text-slate-400 text-xs mb-1">Question {label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value}
            {p.name === 'Score' ? '/100' : '/10'}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function ScoreChart({ scores, difficulties }: ScoreChartProps) {
  const data = scores.map((score, i) => ({
    question: i + 1,
    Score: score,
    Difficulty: difficulties[i] * 10,
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="question"
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="#334155" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="Score"
            stroke="#818cf8"
            strokeWidth={2.5}
            dot={{ fill: '#818cf8', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#818cf8' }}
          />
          <Line
            type="monotone"
            dataKey="Difficulty"
            stroke="#334155"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
