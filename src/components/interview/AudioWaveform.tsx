'use client';

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
  isTranscribing: boolean;
}

export function AudioWaveform({ stream, isRecording, isTranscribing }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    if (!stream || !isRecording) {
      cancelAnimationFrame(animRef.current);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(129,140,248,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      return;
    }

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const waveData = new Uint8Array(analyser.frequencyBinCount);
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(waveData);
      analyser.getByteFrequencyData(freqData);

      ctx.clearRect(0, 0, W, H);

      const barW = W / freqData.length;
      for (let i = 0; i < freqData.length; i++) {
        const barH = (freqData[i] / 255) * (H * 0.45);
        const alpha = 0.1 + (freqData[i] / 255) * 0.3;
        ctx.fillStyle = `rgba(52,211,153,${alpha})`;
        ctx.fillRect(i * barW, H - barH, barW - 1, barH);
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(129,140,248,0.9)';
      ctx.shadowColor = 'rgba(129,140,248,0.6)';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const sliceW = W / waveData.length;
      let x = 0;
      for (let i = 0; i < waveData.length; i++) {
        const y = (waveData[i] / 128.0) * (H / 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      audioCtx.close();
    };
  }, [stream, isRecording]);

  if (!isRecording && !isTranscribing) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isRecording && (
            <>
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-red-400 font-medium">Recording</span>
            </>
          )}
          {isTranscribing && (
            <>
              <svg className="animate-spin w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-indigo-400 font-medium">Transcribing with Whisper...</span>
            </>
          )}
        </div>
        {isRecording && <span className="text-slate-600">Click Stop when done speaking</span>}
      </div>

      {isRecording && (
        <div className="relative bg-slate-900/60 rounded-xl border border-red-500/20 overflow-hidden p-2">
          <canvas ref={canvasRef} width={800} height={64} className="w-full" style={{ height: 64 }} />
        </div>
      )}

      {isTranscribing && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/8 border border-indigo-500/20 rounded-xl">
          <div className="flex gap-1 items-end h-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-indigo-400 rounded-full"
                style={{ height: '100%', animation: `waveform 0.8s ease-in-out ${i * 0.1}s infinite` }}
              />
            ))}
          </div>
          <span className="text-sm text-indigo-300">Converting speech to text with Whisper AI...</span>
        </div>
      )}
    </div>
  );
}
