'use client';

import { useState, useRef, useCallback } from 'react';

interface UseWhisperOptions {
  onTranscript?: (text: string) => void;
}

export function useWhisper({ onTranscript }: UseWhisperOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isSupported =
    typeof window !== 'undefined' &&
    !!(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  const startRecording = useCallback(async () => {
    if (!isSupported) return;
    setError(null);
    chunksRef.current = [];

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

      const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setStream(mediaStream);
      setIsRecording(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setError(msg);
    }
  }, [isSupported]);

  const stopRecording = useCallback(async (): Promise<string> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return '';

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        setStream(null);
        setIsRecording(false);

        if (chunksRef.current.length === 0) {
          resolve('');
          return;
        }

        setIsTranscribing(true);
        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });

          const fd = new FormData();
          fd.append('audio', blob, `recording.${ext}`);

          const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
          const data = await res.json();

          if (!res.ok) throw new Error(data.error ?? 'Transcription failed');

          const text: string = data.transcript ?? '';
          onTranscript?.(text);
          resolve(text);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Transcription failed';
          setError(msg);
          resolve('');
        } finally {
          setIsTranscribing(false);
          chunksRef.current = [];
        }
      };

      recorder.stop();
    });
  }, [onTranscript]);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    isSupported,
    error,
    stream,
    startRecording,
    stopRecording,
    reset,
  };
}
