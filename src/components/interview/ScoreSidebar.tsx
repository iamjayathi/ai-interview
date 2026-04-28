'use client';

import { InterviewQA } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

interface ScoreSidebarProps {
  history: InterviewQA[];
  currentDifficulty: number;
  targetRole: string;
  maxQuestions: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBarColor(score: number): 'emerald' | 'amber' | 'red' {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'amber';
  return 'red';
}

export function ScoreSidebar({ history, currentDifficulty, targetRole, maxQuestions }: ScoreSidebarProps) {
  const avgScore =
    history.length > 0
      ? Math.round(history.reduce((a, b) => a + b.evaluation.score, 0) / history.length)
      : 0;

  const recentTrend =
    history.length >= 2
      ? history[history.length - 1].evaluation.score - history[history.length - 2].evaluation.score
      : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="glass rounded-2xl p-4 border border-slate-800/60">
        <p className="text-xs text-slate-500 mb-1">Applying for</p>
        <p className="text-slate-200 font-semibold text-sm leading-tight">{targetRole}</p>
      </div>

      <div className="glass rounded-2xl p-4 border border-slate-800/60 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Difficulty</p>
          <span className="text-xs font-bold text-indigo-400">{currentDifficulty}/10</span>
        </div>
        <Progress value={currentDifficulty * 10} color="indigo" size="md" />
        <p className="text-xs text-slate-600">
          {currentDifficulty <= 3 ? 'Warming up' : currentDifficulty <= 6 ? 'Intermediate' : 'Advanced'}
        </p>
      </div>

      {history.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-slate-800/60 space-y-2">
          <p className="text-xs text-slate-500">Average Score</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</span>
            <span className="text-slate-600 text-sm mb-1">/100</span>
            {recentTrend !== 0 && (
              <span
                className={`text-xs mb-1 flex items-center gap-0.5 ${recentTrend > 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {recentTrend > 0 ? '↑' : '↓'} {Math.abs(recentTrend)}
              </span>
            )}
          </div>
          <Progress value={avgScore} color={getScoreBarColor(avgScore)} size="md" />
        </div>
      )}

      <div className="glass rounded-2xl p-4 border border-slate-800/60 flex-1 min-h-0">
        <p className="text-xs text-slate-500 mb-3">
          Progress ({history.length}/{maxQuestions})
        </p>
        <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
          {history.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No questions answered yet</p>
          ) : (
            history.map((qa, i) => (
              <div key={`${qa.question.id}-${i}`} className="flex items-center gap-2.5 group">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                    ${qa.evaluation.score >= 80
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : qa.evaluation.score >= 60
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                    }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 truncate leading-tight">
                    {qa.question.focusArea || qa.question.category}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          qa.evaluation.score >= 80
                            ? 'bg-emerald-400'
                            : qa.evaluation.score >= 60
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${qa.evaluation.score}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getScoreColor(qa.evaluation.score)}`}>
                      {qa.evaluation.score}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-slate-800/60">
          <p className="text-xs text-slate-500 mb-3">Session Stats</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-200">
                {Math.round(history.reduce((a, b) => a + b.responseTime, 0) / history.length)}s
              </p>
              <p className="text-xs text-slate-600">Avg Time</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-200">
                {history.filter((h) => h.evaluation.score >= 70).length}
              </p>
              <p className="text-xs text-slate-600">Good Answers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
