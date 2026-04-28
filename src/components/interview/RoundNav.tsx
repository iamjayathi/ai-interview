'use client';

import { RoundType } from '@/lib/types';
import { ROUND_META } from '@/lib/interview-config';

interface RoundNavProps {
  rounds: RoundType[];
  currentRound: RoundType;
  currentRoundIndex: number;
  roundScores: Partial<Record<RoundType, number>>;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreDot(score: number) {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-red-400';
}

export function RoundNav({ rounds, currentRound, currentRoundIndex, roundScores }: RoundNavProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
      {rounds.map((round, index) => {
        const meta = ROUND_META[round];
        const isActive = round === currentRound;
        const isDone = index < currentRoundIndex;
        const score = roundScores[round];

        return (
          <div key={round} className="flex items-center shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all select-none
                ${isActive
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : isDone
                  ? 'bg-slate-800/40 text-slate-400 border border-slate-700/30'
                  : 'bg-transparent text-slate-600 border border-transparent'
                }`}
            >
              {isDone && score !== undefined ? (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getScoreDot(score)}`} />
              ) : isActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
              ) : (
                <span className="text-slate-700 shrink-0">{meta.icon}</span>
              )}

              <span className="whitespace-nowrap">{meta.shortName}</span>

              {isDone && score !== undefined && (
                <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
              )}
            </div>

            {index < rounds.length - 1 && (
              <div className={`w-6 h-px mx-0.5 shrink-0 ${isDone ? 'bg-slate-600' : 'bg-slate-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
