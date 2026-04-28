'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { InterviewState, InterviewSummary } from '@/lib/types';
import { ScoreChart } from '@/components/dashboard/ScoreChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { QAReview } from '@/components/dashboard/QAReview';
import { Button } from '@/components/ui/button';

function OverallScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const label =
    score >= 90 ? 'Outstanding' :
    score >= 80 ? 'Strong' :
    score >= 70 ? 'Good' :
    score >= 60 ? 'Average' :
    score >= 50 ? 'Needs Work' : 'Struggling';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl font-bold" style={{ color }}>{score}</p>
            <p className="text-xs text-slate-600">/100</p>
          </div>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color }}>{label}</p>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ResultsPage() {
  const router = useRouter();
  const [state] = useState<InterviewState | null>(() => loadFromStorage<InterviewState>('interviewState'));
  const [summary, setSummary] = useState<InterviewSummary | null>(() => loadFromStorage<InterviewSummary>('interviewSummary'));
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'review'>('overview');

  const generateSummary = useCallback(async (interviewState: InterviewState) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/interview/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: interviewState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data.summary);
      localStorage.setItem('interviewSummary', JSON.stringify(data.summary));
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (!state) {
      router.push('/');
      return;
    }
    if (!summary && state.history.length > 0) {
      generateSummary(state);
    }
  }, [state, summary, generateSummary, router]);

  const handleRetry = () => {
    localStorage.removeItem('interviewSummary');
    localStorage.removeItem('interviewState');
    router.push('/');
  };

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading results...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)' }}
      />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/60 glass">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-semibold text-slate-200 text-sm">InterviewAI</span>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-sm text-slate-500">Results Dashboard</span>
        </div>
        <Button onClick={handleRetry} variant="secondary" size="sm">New Interview</Button>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="glass rounded-3xl border border-slate-800/60 p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex flex-col items-center lg:items-start gap-4">
              {generating ? (
                <div className="flex flex-col items-center gap-4 w-36">
                  <div className="w-36 h-36 rounded-full border-2 border-indigo-500/20 flex items-center justify-center">
                    <svg className="animate-spin w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500 text-center">Generating AI analysis...</p>
                </div>
              ) : summary ? (
                <OverallScoreRing score={summary.overallScore} />
              ) : (
                <div className="text-slate-500 text-sm">No summary available</div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Interview complete</p>
                <h1 className="text-2xl font-bold text-slate-100">
                  {state.resumeData.name}&apos;s Results
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {state.targetRole} · {state.history.length} questions answered
                </p>
              </div>
              {summary?.overallFeedback && (
                <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-indigo-500/40 pl-3">
                  {summary.overallFeedback}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Questions', value: state.history.length },
                  { label: 'Total Time', value: summary ? formatTime(summary.totalTime) : '—' },
                  { label: 'Avg Response', value: summary ? `${summary.averageResponseTime}s` : '—' },
                  { label: 'Best Score', value: state.history.length > 0 ? `${Math.max(...state.history.map(h => h.evaluation.score))}` : '—' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/40">
                    <p className="text-lg font-bold text-slate-200">{stat.value}</p>
                    <p className="text-xs text-slate-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-slate-900/60 rounded-2xl border border-slate-800/60 w-fit">
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'analysis', label: 'Analysis' },
            { id: 'review', label: 'Q&A Review' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl border border-slate-800/60 p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Score Progression
              </h2>
              {state.history.length > 0 ? (
                <ScoreChart
                  scores={state.history.map(h => h.evaluation.score)}
                  difficulties={state.history.map(h => h.question.difficulty)}
                />
              ) : (
                <p className="text-slate-600 text-sm">No data yet</p>
              )}
              <p className="text-xs text-slate-600 mt-2">Solid = your score · Dashed = difficulty</p>
            </div>

            {summary && (
              <div className="glass rounded-2xl border border-slate-800/60 p-6">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Category Scores
                </h2>
                <CategoryBreakdown roundScores={summary.roundScores} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && summary && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl border border-slate-800/60 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Areas to Improve
              </h2>
              <div className="space-y-3">
                {summary.weakAreas.map((area, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                    <div className="w-5 h-5 bg-amber-500/15 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-300">{area}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl border border-slate-800/60 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Strong Areas
              </h2>
              <div className="space-y-3">
                {summary.strongAreas.map((area, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                    <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-slate-300">{area}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 glass rounded-2xl border border-slate-800/60 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Action Plan — What to Practice Next
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {summary.recommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                    <div className="w-6 h-6 bg-indigo-500/15 rounded-full flex items-center justify-center mb-3">
                      <span className="text-indigo-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Click any question to expand the full answer and feedback.</p>
            <QAReview history={state.history} />
          </div>
        )}

        <div className="glass rounded-2xl border border-slate-800/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-200">Ready for another round?</p>
            <p className="text-sm text-slate-500">Practice makes perfect. Each session adapts to your growth.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" onClick={() => window.print()}>Save Results</Button>
            <Button size="md" onClick={handleRetry}>
              New Interview
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
