'use client';

import { useEffect } from 'react';
import { Question, RoundType } from '@/lib/types';
import { ROUND_META } from '@/lib/interview-config';
import { useTypewriter } from '@/hooks/useTypewriter';

interface QuestionDisplayProps {
  question: Question | null;
  questionNumber: number;
  totalQuestions: number;
  round: RoundType;
  onTypingComplete?: () => void;
  isSpeaking?: boolean;
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  round,
  onTypingComplete,
  isSpeaking,
}: QuestionDisplayProps) {
  const { displayedText, isComplete } = useTypewriter(question?.text ?? '', 18);

  useEffect(() => {
    if (isComplete && question) {
      onTypingComplete?.();
    }
  }, [isComplete, question, onTypingComplete]);

  const roundMeta = ROUND_META[round];

  if (!question) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Generating question...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center
              ${isSpeaking ? 'bg-emerald-500/20' : 'bg-indigo-500/15'}`}>
              <svg className={`w-5 h-5 ${isSpeaking ? 'text-emerald-400' : 'text-indigo-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            {isSpeaking && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium">AI Interviewer</p>
            <p className="text-xs text-slate-600">
              Question {questionNumber} of {totalQuestions} · {roundMeta.shortName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-xs text-slate-400">
            <span>{roundMeta.icon}</span>
            {roundMeta.shortName}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border
            ${question.difficulty <= 3
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : question.difficulty <= 6
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
            D{question.difficulty}
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 to-transparent rounded-full" />
        <div className="pl-4">
          <p className="text-slate-100 text-lg leading-relaxed font-medium min-h-[3.5rem]">
            {displayedText}
            {!isComplete && (
              <span className="inline-block w-0.5 h-5 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>
      </div>

      {isComplete && (
        <div className="space-y-2">
          {question.focusArea && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Focus: {question.focusArea}</span>
            </div>
          )}
          {question.evaluationCriteria && question.evaluationCriteria.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.evaluationCriteria.map((c, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-800/40 border border-slate-700/30 rounded-lg text-xs text-slate-600">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
