'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ResumeData, ResumeChunk } from '@/lib/types';

interface ResumeUploadProps {
  onSuccess: (resumeData: ResumeData, resumeChunks: ResumeChunk[], semantic: boolean) => void;
}

export function ResumeUpload({ onSuccess }: ResumeUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      setError(null);
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append('resume', file);

        const res = await fetch('/api/parse-resume', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to parse resume');
        }

        onSuccess(data.resumeData, data.resumeChunks ?? [], data.meta?.semantic ?? false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload resume');
        setFileName(null);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-300 group
          ${isDragActive
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/40'
          }
          ${loading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <>
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 flex items-center justify-center">
                  <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-slate-300 font-medium">Parsing + embedding resume...</p>
                <p className="text-slate-500 text-sm mt-1">{fileName}</p>
                <p className="text-slate-600 text-xs mt-0.5">Building semantic search index</p>
              </div>
            </>
          ) : (
            <>
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                  ${isDragActive ? 'bg-indigo-500/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}
              >
                <svg
                  className={`w-8 h-8 transition-colors ${isDragActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div>
                <p className={`font-semibold text-lg transition-colors ${isDragActive ? 'text-indigo-300' : 'text-slate-200'}`}>
                  {isDragActive ? 'Drop it here' : 'Drop your resume here'}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  PDF files only · Max 10MB
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-slate-700" />
                <span className="text-slate-600 text-xs">or</span>
                <div className="h-px w-12 bg-slate-700" />
              </div>

              <span className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-sm font-medium transition-all">
                Browse files
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
