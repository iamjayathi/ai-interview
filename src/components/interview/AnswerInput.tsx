'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWhisper } from '@/hooks/useWhisper';
import { AudioWaveform } from './AudioWaveform';

interface AnswerInputProps {
  onSubmit: (answer: string, responseTime: number) => void;
  isLoading: boolean;
  disabled?: boolean;
  startTime: number | null;
}

export function AnswerInput({ onSubmit, isLoading, disabled, startTime }: AnswerInputProps) {
  const [answer, setAnswer] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isRecording, isTranscribing, isSupported, error, stream, startRecording, stopRecording, reset } =
    useWhisper({
      onTranscript: (text) => {
        if (text) {
          setAnswer((prev) => (prev.trim() ? prev.trim() + ' ' + text : text));
          setTimeout(() => {
            const ta = textareaRef.current;
            if (ta) {
              ta.scrollTop = ta.scrollHeight;
              ta.focus();
            }
          }, 50);
        }
      },
    });

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 240) + 'px';
  }, [answer]);

  const handleSubmit = () => {
    if (!answer.trim() || isLoading) return;
    const responseTime = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    onSubmit(answer.trim(), responseTime);
    setAnswer('');
    reset();
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      reset();
      await startRecording();
    }
  };

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const isBusy = isLoading || isTranscribing;

  return (
    <div className="space-y-3">
      <AudioWaveform stream={stream} isRecording={isRecording} isTranscribing={isTranscribing} />

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
          <button onClick={reset} className="ml-auto underline">Dismiss</button>
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={
            isRecording
              ? 'Speaking... text will appear here when you stop recording'
              : isTranscribing
              ? 'Transcribing your speech...'
              : 'Type your answer, or click the mic to speak...'
          }
          disabled={disabled || isBusy}
          rows={4}
          className={`
            w-full resize-none rounded-xl border text-slate-200 text-sm leading-relaxed
            placeholder:text-slate-600 bg-slate-800/50
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50
            transition-all duration-200 p-4 pr-16
            disabled:opacity-60 disabled:cursor-not-allowed
            ${isRecording
              ? 'border-red-500/30 bg-red-500/5'
              : isTranscribing
              ? 'border-indigo-500/40'
              : 'border-slate-700/60'
            }
          `}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="absolute bottom-3 right-3 text-xs text-slate-600 select-none">
          {wordCount}w
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isSupported && (
            <button
              onClick={handleVoiceToggle}
              disabled={disabled || isLoading || isTranscribing}
              title={isRecording ? 'Stop recording' : 'Record answer with Whisper AI'}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-200 border select-none
                ${isRecording
                  ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-lg shadow-red-500/10'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200 hover:bg-slate-700/50 hover:border-slate-600'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-xl animate-pulse-ring bg-red-400 opacity-15" />
              )}

              {isRecording ? (

                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (

                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}

              {isRecording ? 'Stop' : 'Record'}

              {!isRecording && (
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded-md border border-indigo-500/20 leading-none">
                  Whisper
                </span>
              )}
            </button>
          )}

          {answer && !isRecording && (
            <button
              onClick={() => setAnswer('')}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors px-2 py-1"
            >
              Clear
            </button>
          )}

          <span className="text-xs text-slate-600 hidden sm:block">⌘ + Enter to submit</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || disabled || isRecording}
          loading={isBusy}
          size="md"
        >
          {isTranscribing ? 'Transcribing...' : isLoading ? 'Evaluating...' : 'Submit Answer'}
          {!isBusy && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </Button>
      </div>

      {!isRecording && !isTranscribing && isSupported && !answer && (
        <p className="text-xs text-slate-700">
          Tip: Click <span className="text-slate-500">Record</span> → speak your full answer → click <span className="text-slate-500">Stop</span>. Whisper will transcribe it accurately.
        </p>
      )}
    </div>
  );
}
