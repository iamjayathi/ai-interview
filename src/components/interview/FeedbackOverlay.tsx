'use client';

import { AnswerEvaluation } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface FeedbackOverlayProps {
  evaluation: AnswerEvaluation | null;
  isVisible: boolean;
  onNext: () => void;
  isLastQuestion: boolean;
  isLoading?: boolean;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color }}>{score}</p>
          <p className="text-xs text-slate-600">/100</p>
        </div>
      </div>
    </div>
  );
}

export function FeedbackOverlay({
  evaluation,
  isVisible,
  onNext,
  isLastQuestion,
  isLoading,
}: FeedbackOverlayProps) {
  if (!isVisible) return null;

  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">AI is evaluating your answer...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/97 backdrop-blur-sm rounded-2xl z-10 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-5">
          <ScoreRing score={evaluation.score} />
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Answer Evaluated</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{evaluation.feedback}</p>
          </div>
        </div>

        {evaluation.strengths.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">What you did well</p>
            <div className="space-y-1.5">
              {evaluation.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-slate-300">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {evaluation.weaknesses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Areas to improve</p>
            <div className="space-y-1.5">
              {evaluation.weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-slate-300">{w}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {evaluation.suggestedImprovement && (
          <div className="p-3 bg-indigo-500/8 border border-indigo-500/15 rounded-xl">
            <p className="text-xs font-semibold text-indigo-400 mb-1">Key improvement</p>
            <p className="text-sm text-slate-300">{evaluation.suggestedImprovement}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">Confidence score:</p>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all duration-1000"
              style={{ width: `${evaluation.confidenceScore}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">{evaluation.confidenceScore}%</span>
        </div>

        <Button onClick={onNext} size="lg" className="w-full">
          {isLastQuestion ? (
            <>
              View Full Results
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </>
          ) : (
            <>
              Next Question
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
