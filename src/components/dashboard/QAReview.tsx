'use client';

import { useState } from 'react';
import { InterviewQA } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { QuestionCategory } from '@/lib/types';

interface QAReviewProps {
  history: InterviewQA[];
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
      : score >= 60
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
      : 'bg-red-500/15 text-red-400 border-red-500/25';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}/100
    </span>
  );
}

export function QAReview({ history }: QAReviewProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {history.map((qa, i) => (
        <div
          key={qa.question.id}
          className="glass rounded-xl border border-slate-800/60 overflow-hidden"
        >
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                  ${qa.evaluation.score >= 80
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : qa.evaluation.score >= 60
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-red-500/15 text-red-400'
                  }`}
              >
                {i + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-300 truncate">{qa.question.text.substring(0, 80)}...</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={qa.question.category as QuestionCategory}>
                    {qa.question.category}
                  </Badge>
                  <span className="text-xs text-slate-600">⏱ {formatTime(qa.responseTime)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <ScoreBadge score={qa.evaluation.score} />
              <svg
                className={`w-4 h-4 text-slate-600 transition-transform ${expanded === i ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expanded === i && (
            <div className="border-t border-slate-800/60 p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Question</p>
                <p className="text-sm text-slate-300 leading-relaxed">{qa.question.text}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Answer</p>
                <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/40 rounded-lg p-3">
                  {qa.answer}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">AI Feedback</p>
                <p className="text-sm text-slate-300 leading-relaxed">{qa.evaluation.feedback}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-400">Strengths</p>
                  {qa.evaluation.strengths.map((s, j) => (
                    <p key={j} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">✓</span> {s}
                    </p>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-amber-400">To Improve</p>
                  {qa.evaluation.weaknesses.map((w, j) => (
                    <p key={j} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">△</span> {w}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
