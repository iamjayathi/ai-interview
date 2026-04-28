'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InterviewState, Question, AnswerEvaluation, InterviewQA, RoundType, CodeSubmission } from '@/lib/types';
import { ROUND_META } from '@/lib/interview-config';
import { computeRoundScore } from '@/lib/interview-utils';
import { QuestionDisplay } from '@/components/interview/QuestionDisplay';
import { AnswerInput } from '@/components/interview/AnswerInput';
import { TimerBar } from '@/components/interview/TimerBar';
import { ScoreSidebar } from '@/components/interview/ScoreSidebar';
import { FeedbackOverlay } from '@/components/interview/FeedbackOverlay';
import { RoundNav } from '@/components/interview/RoundNav';
import { CodeEditor } from '@/components/interview/CodeEditor';
import { Progress } from '@/components/ui/progress';
import { useVoice } from '@/hooks/useVoice';

type Phase = 'loading' | 'round-intro' | 'answering' | 'evaluating' | 'feedback' | 'round-complete' | 'complete';

function loadState(): InterviewState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('interviewState');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(s: InterviewState) {
  localStorage.setItem('interviewState', JSON.stringify(s));
}

function RoundIntro({ round, onStart }: { round: RoundType; onStart: () => void }) {
  const meta = ROUND_META[round];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
      <div className="text-5xl">{meta.icon}</div>
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">{meta.name}</h2>
        <p className="text-slate-400 max-w-md">{meta.description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {meta.evaluationFocus.map((f) => (
          <span key={f} className="px-3 py-1 bg-slate-800/60 border border-slate-700/40 rounded-xl text-xs text-slate-400">
            {f}
          </span>
        ))}
      </div>
      {meta.hasCoding && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          This round includes a live coding environment
        </div>
      )}
      <button
        onClick={onStart}
        className="flex items-center gap-2 px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-medium transition-all shadow-lg shadow-indigo-500/20"
      >
        Start Round
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
}

function RoundComplete({
  round,
  score,
  isLast,
  onNext,
}: {
  round: RoundType;
  score: number;
  isLast: boolean;
  onNext: () => void;
}) {
  const meta = ROUND_META[round];
  const color = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red';
  const colorCls = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const bgCls = score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : score >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
      <div className={`w-20 h-20 rounded-3xl ${bgCls} border flex items-center justify-center`}>
        <span className={`text-3xl font-bold ${colorCls}`}>{score}</span>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">{meta.icon} {meta.name} — Round Complete</p>
        <h2 className="text-2xl font-bold text-slate-100">
          {score >= 80 ? 'Excellent work!' : score >= 60 ? 'Solid round.' : 'Needs improvement.'}
        </h2>
      </div>
      <Progress value={score} color={color as 'emerald' | 'amber' | 'red'} size="md" />
      <button
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-medium transition-all"
      >
        {isLast ? 'View Full Results' : 'Next Round'}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
}

export default function InterviewPage() {
  const router = useRouter();
  const [state, setState] = useState<InterviewState | null>(loadState);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [phase, setPhase] = useState<Phase>(() => (loadState() ? 'round-intro' : 'loading'));
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeSubmission, setCodeSubmission] = useState<CodeSubmission | undefined>(undefined);

  const questionTypedRef = useRef(false);

  const { speak, stopSpeaking } = useVoice();

  useEffect(() => {
    if (!state) router.push('/');
  }, [state, router]);

  const currentRound: RoundType = state?.currentRound ?? 'resume';
  const roundMeta = ROUND_META[currentRound];
  const roundHistory = state ? state.history.filter((h) => h.round === currentRound) : [];
  const questionInRound = roundHistory.length;
  const isRoundComplete = state ? questionInRound >= state.maxQuestionsPerRound : false;
  const isLastRound = state ? state.currentRoundIndex >= state.rounds.length - 1 : false;
  const overallProgress = state
    ? ((state.currentRoundIndex * state.maxQuestionsPerRound + questionInRound) /
        (state.rounds.length * state.maxQuestionsPerRound)) * 100
    : 0;

  const fetchQuestion = useCallback(async (currentState: InterviewState) => {
    setPhase('loading');
    setCurrentQuestion(null);
    setCurrentEvaluation(null);
    setCodeSubmission(undefined);
    questionTypedRef.current = false;
    setError(null);

    try {
      const res = await fetch('/api/interview/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: currentState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentQuestion(data.question);
      setPhase('answering');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate question');
      setPhase('answering');
    }
  }, []);

  const handleAnswerSubmit = useCallback(async (answer: string, responseTime: number) => {
    if (!state || !currentQuestion) return;

    stopSpeaking();
    setPhase('evaluating');
    setError(null);

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          question: currentQuestion,
          answer,
          responseTime,
          code: codeSubmission,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const qa: InterviewQA = {
        question: currentQuestion,
        answer,
        code: codeSubmission,
        responseTime,
        evaluation: data.evaluation,
        timestamp: Date.now(),
        round: currentRound,
      };

      const updatedState: InterviewState = {
        ...state,
        history: [...state.history, qa],
        currentDifficulty: data.newDifficulty,
        questionCount: state.questionCount + 1,
      };

      setState(updatedState);
      saveState(updatedState);
      setCurrentEvaluation(data.evaluation);
      setPhase('feedback');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate answer');
      setPhase('answering');
    }
  }, [state, currentQuestion, codeSubmission, currentRound, stopSpeaking]);

  const handleNext = useCallback(() => {
    if (!state) return;

    const newRoundHistory = state.history.filter((h) => h.round === currentRound);
    const roundDone = newRoundHistory.length >= state.maxQuestionsPerRound;

    if (roundDone) {
      const score = computeRoundScore(state.history, currentRound);
      const updatedState: InterviewState = {
        ...state,
        roundScores: { ...state.roundScores, [currentRound]: score },
      };
      setState(updatedState);
      saveState(updatedState);
      setPhase('round-complete');
    } else {
      fetchQuestion(state);
    }
  }, [state, currentRound, fetchQuestion]);

  const handleNextRound = useCallback(async () => {
    if (!state) return;

    if (isLastRound) {
      setPhase('complete');
      try {
        const res = await fetch('/api/interview/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state }),
        });
        const data = await res.json();
        if (data.summary) localStorage.setItem('interviewSummary', JSON.stringify(data.summary));
      } catch (err) {
        console.error('Summary error:', err);
      }
      router.push('/results');
    } else {
      const nextIndex = state.currentRoundIndex + 1;
      const nextRound = state.rounds[nextIndex];
      const updatedState: InterviewState = {
        ...state,
        currentRoundIndex: nextIndex,
        currentRound: nextRound,
        currentDifficulty: 4,
      };
      setState(updatedState);
      saveState(updatedState);
      setPhase('round-intro');
    }
  }, [state, isLastRound, router]);

  const handleTimerExpire = useCallback(() => {
    handleAnswerSubmit('[Time expired — no answer submitted]', state?.pressureTimeLimit ?? 120);
  }, [handleAnswerSubmit, state]);

  const handleTypingComplete = useCallback(() => {
    if (questionTypedRef.current || !currentQuestion) return;
    questionTypedRef.current = true;
    setAnswerStartTime(Date.now());
    speak(currentQuestion.text);
  }, [currentQuestion, speak]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading session...
        </div>
      </div>
    );
  }

  const roundScore = state.roundScores[currentRound] ?? 0;

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />

      <header className="relative z-10 border-b border-slate-800/60 glass">
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-200 text-sm shrink-0">InterviewAI</span>
            <div className="h-4 w-px bg-slate-700 shrink-0" />
            <span className="text-sm text-slate-500 truncate">{state.targetRole}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-600">
                Round {state.currentRoundIndex + 1}/{state.rounds.length}
              </span>
              <div className="w-28">
                <Progress value={overallProgress} color="indigo" />
              </div>
            </div>
            {state.pressureMode && (
              <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
                Pressure
              </span>
            )}
            <button
              onClick={() => { if (confirm('End interview and view results?')) router.push('/results'); }}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              End
            </button>
          </div>
        </div>

        <div className="px-6 py-2 border-t border-slate-800/40 max-w-7xl mx-auto overflow-x-auto">
          <RoundNav
            rounds={state.rounds}
            currentRound={currentRound}
            currentRoundIndex={state.currentRoundIndex}
            roundScores={state.roundScores}
          />
        </div>
      </header>

      <div className="relative z-10 flex-1 flex gap-0 overflow-hidden max-w-7xl w-full mx-auto px-6 py-6">
        <div className="hidden lg:flex w-60 shrink-0 pr-6">
          <ScoreSidebar
            history={state.history}
            currentDifficulty={state.currentDifficulty}
            targetRole={state.targetRole}
            maxQuestions={state.rounds.length * state.maxQuestionsPerRound}
          />
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {state.pressureMode && phase === 'answering' && (
            <div className="glass rounded-2xl border border-slate-800/60 px-4 py-3">
              <TimerBar
                timeLimit={state.pressureTimeLimit}
                isActive={phase === 'answering'}
                onExpire={handleTimerExpire}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
              <button onClick={() => state && fetchQuestion(state)} className="ml-auto text-xs underline">Retry</button>
            </div>
          )}

          <div className="relative glass rounded-2xl border border-slate-800/60 flex-1 overflow-hidden">
            {phase === 'round-intro' && (
              <div className="p-8 h-full">
                <RoundIntro
                  round={currentRound}
                  onStart={() => fetchQuestion(state)}
                />
              </div>
            )}

            {phase === 'round-complete' && (
              <div className="p-8 h-full">
                <RoundComplete
                  round={currentRound}
                  score={roundScore}
                  isLast={isLastRound}
                  onNext={handleNextRound}
                />
              </div>
            )}

            {phase === 'complete' && (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center space-y-3">
                  <svg className="animate-spin w-8 h-8 text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-slate-400">Generating your performance report...</p>
                </div>
              </div>
            )}

            {(phase === 'loading' || phase === 'answering' || phase === 'evaluating' || phase === 'feedback') && (
              <div className="p-6 flex flex-col gap-5 h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: state.maxQuestionsPerRound }).map((_, i) => {
                      const done = i < questionInRound;
                      const current = i === questionInRound && phase !== 'feedback';
                      return (
                        <div key={i} className={`h-1.5 rounded-full transition-all
                          ${done
                            ? 'w-6 bg-indigo-400'
                            : current
                            ? 'w-8 bg-indigo-400 animate-pulse'
                            : 'w-6 bg-slate-700'
                          }`} />
                      );
                    })}
                    <span className="text-xs text-slate-600 ml-1">
                      {questionInRound}/{state.maxQuestionsPerRound} in {roundMeta.shortName}
                    </span>
                  </div>
                </div>

                <QuestionDisplay
                  question={currentQuestion}
                  questionNumber={questionInRound + 1}
                  totalQuestions={state.maxQuestionsPerRound}
                  round={currentRound}
                  onTypingComplete={handleTypingComplete}
                />

                {currentQuestion?.hasCodingChallenge && phase !== 'loading' && (
                  <div className="border-t border-slate-800/60 pt-4">
                    <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Code Editor
                    </p>
                    <CodeEditor
                      language={currentQuestion.codeLanguage ?? 'python'}
                      starterTemplate={currentQuestion.codeStarterTemplate}
                      onCodeChange={setCodeSubmission}
                      disabled={phase === 'feedback' || phase === 'evaluating'}
                    />
                  </div>
                )}

                {currentQuestion && <div className="h-px bg-slate-800/60" />}

                {currentQuestion && phase !== 'loading' && (
                  <AnswerInput
                    onSubmit={handleAnswerSubmit}
                    isLoading={phase === 'evaluating'}
                    disabled={phase === 'feedback'}
                    startTime={answerStartTime}
                  />
                )}

                <FeedbackOverlay
                  evaluation={currentEvaluation}
                  isVisible={phase === 'feedback' || phase === 'evaluating'}
                  isLoading={phase === 'evaluating'}
                  onNext={handleNext}
                  isLastQuestion={isRoundComplete}
                />
              </div>
            )}
          </div>

          <div className="lg:hidden grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 border border-slate-800/60 text-center">
              <p className="text-lg font-bold text-indigo-400">{state.currentDifficulty}/10</p>
              <p className="text-xs text-slate-600">Difficulty</p>
            </div>
            <div className="glass rounded-xl p-3 border border-slate-800/60 text-center">
              <p className="text-lg font-bold text-slate-200">
                {state.history.length > 0
                  ? Math.round(state.history.reduce((a, b) => a + b.evaluation.score, 0) / state.history.length)
                  : '—'}
              </p>
              <p className="text-xs text-slate-600">Avg Score</p>
            </div>
            <div className="glass rounded-xl p-3 border border-slate-800/60 text-center">
              <p className="text-lg font-bold text-slate-200">
                {state.currentRoundIndex + 1}/{state.rounds.length}
              </p>
              <p className="text-xs text-slate-600">Round</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
