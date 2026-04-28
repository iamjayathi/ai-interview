'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResumeUpload } from '@/components/ResumeUpload';
import { Button } from '@/components/ui/button';
import { ResumeData, ResumeChunk, RoleType, InterviewState } from '@/lib/types';
import { ROLE_CONFIGS, ROUND_META } from '@/lib/interview-config';
import { buildResumeChunks } from '@/lib/rag';

type Step = 'upload' | 'role' | 'configure';

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: RoleType;
  selected: boolean;
  onSelect: () => void;
}) {
  const config = ROLE_CONFIGS[role];
  return (
    <button
      onClick={onSelect}
      className={`relative text-left p-5 rounded-2xl border transition-all group
        ${selected
          ? 'border-indigo-500/60 bg-indigo-500/8 shadow-lg shadow-indigo-500/10'
          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/60 hover:bg-slate-800/50'
        }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      <div className="text-2xl mb-3">{config.icon}</div>
      <p className="font-semibold text-slate-200 mb-0.5">{config.name}</p>
      <p className="text-xs text-slate-500 mb-3">{config.description}</p>
      <div className="flex flex-wrap gap-1">
        {config.rounds.map((r) => (
          <span key={r} className="px-2 py-0.5 bg-slate-700/50 text-slate-500 rounded-md text-[11px]">
            {ROUND_META[r].shortName}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeChunks, setResumeChunks] = useState<ResumeChunk[]>([]);
  const [semanticRag, setSemanticRag] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>('SDE');
  const [targetRole, setTargetRole] = useState('');
  const [maxQuestionsPerRound, setMaxQuestionsPerRound] = useState(3);
  const [pressureMode, setPressureMode] = useState(false);
  const [pressureTimeLimit, setPressureTimeLimit] = useState(120);

  const roleConfig = ROLE_CONFIGS[selectedRole];

  const handleResumeSuccess = (data: ResumeData, chunks: ResumeChunk[], semantic: boolean) => {
    setResumeData(data);
    setResumeChunks(chunks);
    setSemanticRag(semantic);
    setStep('role');
  };

  const handleStart = () => {
    if (!resumeData) return;
    const finalRole = targetRole.trim() || roleConfig.defaultRole;

    const rounds = roleConfig.rounds;
    const chunks = resumeChunks.length > 0 ? resumeChunks : buildResumeChunks(resumeData);

    const state: InterviewState = {
      sessionId: `session_${Date.now()}`,
      resumeData,
      resumeChunks: chunks,
      targetRole: finalRole,
      role: selectedRole,
      rounds,
      currentRoundIndex: 0,
      currentRound: rounds[0],
      history: [],
      currentDifficulty: 4,
      questionCount: 0,
      maxQuestionsPerRound,
      pressureMode,
      pressureTimeLimit,
      startedAt: Date.now(),
      roundScores: {},
    };

    localStorage.setItem('interviewState', JSON.stringify(state));
    router.push('/interview');
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Resume' },
    { id: 'role', label: 'Role' },
    { id: 'configure', label: 'Configure' },
  ];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen grid-bg">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
      />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-bold text-slate-200">InterviewAI</span>
        </div>
       
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center pt-10 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            RAG · Multi-Round · Live Coding · Voice Mode
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-slate-100">Ace Your</span>
            <br />
            <span className="gradient-text">Next Interview</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload your resume. Pick your role. AI generates tailored questions across every round
            from DSA to behavioral and coaches you with structured feedback.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-3xl border border-slate-800/60 p-8">
            <div className="flex items-center mb-8">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0
                      ${step === s.id
                        ? 'bg-indigo-500 text-white'
                        : i < stepIndex
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-600'
                      }`}
                  >
                    {i < stepIndex ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-sm ${step === s.id ? 'text-slate-200' : i < stepIndex ? 'text-slate-500' : 'text-slate-600'}`}>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-2 ${i < stepIndex ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />
                  )}
                </div>
              ))}
            </div>

            {step === 'upload' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100 mb-1">Upload your resume</h2>
                  <p className="text-sm text-slate-500">
                    AI reads your actual experience and tailors every question to you.
                  </p>
                </div>
                <ResumeUpload onSuccess={handleResumeSuccess} />
              </div>
            )}

            {step === 'role' && resumeData && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                  <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-300 truncate">{resumeData.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {resumeData.skills.slice(0, 5).join(' · ')}{resumeData.skills.length > 5 ? ` +${resumeData.skills.length - 5}` : ''}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border leading-none ${semanticRag ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' : 'bg-slate-700/50 text-slate-500 border-slate-600/30'}`}>
                      {semanticRag ? '⚡ Semantic RAG' : 'Keyword RAG'}
                    </span>
                  </div>
                  <button onClick={() => setStep('upload')} className="ml-auto text-xs text-slate-600 hover:text-slate-400 shrink-0">
                    Change
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-100 mb-1">Choose your interview type</h2>
                  <p className="text-sm text-slate-500">Each type has a specific set of rounds tailored to that role.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(Object.keys(ROLE_CONFIGS) as RoleType[]).map((role) => (
                    <RoleCard
                      key={role}
                      role={role}
                      selected={selectedRole === role}
                      onSelect={() => setSelectedRole(role)}
                    />
                  ))}
                </div>

                <Button onClick={() => setStep('configure')} size="lg" className="w-full">
                  Continue with {ROLE_CONFIGS[selectedRole].name}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>
            )}

            {step === 'configure' && resumeData && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100 mb-1">Configure your session</h2>
                  <p className="text-sm text-slate-500">
                    {roleConfig.rounds.length} rounds · {roleConfig.rounds.length * maxQuestionsPerRound} questions total
                  </p>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/40 space-y-2">
                  <p className="text-xs font-medium text-slate-400 mb-3">Interview rounds</p>
                  <div className="space-y-2">
                    {roleConfig.rounds.map((round, i) => {
                      const meta = ROUND_META[round];
                      return (
                        <div key={round} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-slate-700/60 flex items-center justify-center text-xs text-slate-500 shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-sm">{meta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300">{meta.name}</p>
                            <p className="text-xs text-slate-600 truncate">{meta.description}</p>
                          </div>
                          {meta.hasCoding && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded border border-indigo-500/20">
                              Coding
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Job title <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${roleConfig.defaultRole} at Google`}
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300">Questions per round</label>
                    <span className="text-sm font-bold text-indigo-400">{maxQuestionsPerRound}</span>
                  </div>
                  <input
                    type="range" min={2} max={6} value={maxQuestionsPerRound}
                    onChange={(e) => setMaxQuestionsPerRound(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>2 (Quick)</span><span>6 (Deep)</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
                  <button
                    onClick={() => setPressureMode((p) => !p)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${pressureMode ? 'bg-indigo-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pressureMode ? 'translate-x-5' : ''}`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                      Pressure Mode
                      <span className="text-xs px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-md border border-red-500/20">Timer</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Time-limited answers — simulates real interview pressure.
                    </p>
                    {pressureMode && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-600">Time limit:</span>
                        <select
                          value={pressureTimeLimit}
                          onChange={(e) => setPressureTimeLimit(parseInt(e.target.value))}
                          className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
                        >
                          <option value={60}>60s</option>
                          <option value={90}>90s</option>
                          <option value={120}>2 min</option>
                          <option value={180}>3 min</option>
                          <option value={300}>5 min</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('role')}
                    className="px-4 py-2.5 rounded-xl border border-slate-700/60 text-slate-400 text-sm hover:border-slate-600 hover:text-slate-300 transition-all"
                  >
                    Back
                  </button>
                  <Button onClick={handleStart} size="lg" className="flex-1">
                    Start Interview
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '🧠',
              title: 'RAG-Powered Questions',
              desc: 'Every question is grounded in your actual resume — projects, tech stack, experience — not generic templates.',
            },
            {
              icon: '⚡',
              title: 'Live Code Execution',
              desc: 'DSA, LLD, and SQL rounds include a Monaco editor with real-time sandboxed execution via Piston.',
            },
            {
              icon: '🎯',
              title: 'Adaptive Difficulty',
              desc: 'Questions get harder when you nail it, easier when you slip — calibrated to your actual skill level.',
            },
            {
              icon: '🎤',
              title: 'Whisper Voice Mode',
              desc: 'Speak your answers. Groq Whisper transcribes with near-perfect accuracy, just like a real verbal interview.',
            },
            {
              icon: '📊',
              title: 'Per-Round Scoring',
              desc: 'Separate scores for each round — see exactly where you shine and where to focus your prep.',
            },
            {
              icon: '🔄',
              title: 'Multi-Role Support',
              desc: 'SDE, PM, and Data Analyst loops — each with the right rounds for that specific interview type.',
            },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6 border border-slate-800/60 hover:border-slate-700/60 transition-all group">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-200 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
