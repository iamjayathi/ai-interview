'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CODE_LANGUAGE_OPTIONS } from '@/lib/interview-config';
import { CodeSubmission } from '@/lib/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading editor...
      </div>
    </div>
  ),
});

interface CodeEditorProps {
  language?: string;
  starterTemplate?: string;
  onCodeChange: (submission: CodeSubmission) => void;
  disabled?: boolean;
}

const STARTER_TEMPLATES: Record<string, string> = {
  python:     `def solution():\n    # Write your solution here\n    pass\n\n# Test your solution\nprint(solution())`,
  javascript: `function solution() {\n  // Write your solution here\n}\n\n// Test your solution\nconsole.log(solution());`,
  typescript: `function solution(): void {\n  // Write your solution here\n}\n\nconsole.log(solution());`,
  java:       `public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  cpp:        `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  go:         `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello")\n}`,
  sql:        `-- Write your SQL query here\nSELECT *\nFROM table_name\nWHERE condition;`,
};

type PyodideInstance = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
};

let pyodideCache: PyodideInstance | null = null;
let pyodideLoadPromise: Promise<PyodideInstance> | null = null;

function getPyodide(): Promise<PyodideInstance> {
  if (pyodideCache) return Promise.resolve(pyodideCache);
  if (pyodideLoadPromise) return pyodideLoadPromise;

  pyodideLoadPromise = new Promise((resolve, reject) => {
    const PYODIDE_VERSION = '0.26.4';
    const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

    const existing = document.querySelector(`script[data-pyodide]`);
    if (!existing) {
      const script = document.createElement('script');
      script.src = `${INDEX_URL}pyodide.js`;
      script.dataset.pyodide = '1';
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    }

    const poll = setInterval(() => {
      const loader = (window as any).loadPyodide;
      if (typeof loader === 'function') {
        clearInterval(poll);
        loader({ indexURL: INDEX_URL })
          .then((py: PyodideInstance) => {
            pyodideCache = py;
            resolve(py);
          })
          .catch(reject);
      }
    }, 100);
  });

  return pyodideLoadPromise;
}

async function executePython(code: string): Promise<{ output: string; error: string; executionTime: number }> {
  const start = Date.now();
  let output = '';
  let errorMsg = '';

  try {
    const py = await getPyodide();
    py.setStdout({ batched: (s) => { output += s + '\n'; } });
    py.setStderr({ batched: (s) => { errorMsg += s + '\n'; } });
    await py.runPythonAsync(code);
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  return {
    output:        output.trim(),
    error:         errorMsg.trim(),
    executionTime: Date.now() - start,
  };
}

export function CodeEditor({ language: initialLang = 'python', starterTemplate, onCodeChange, disabled }: CodeEditorProps) {
  const [language, setLanguage] = useState(initialLang);
  const [code, setCode]         = useState(starterTemplate ?? STARTER_TEMPLATES[initialLang] ?? '');
  const [output, setOutput]     = useState<string | null>(null);
  const [execError, setExecError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime]   = useState<number | null>(null);
  const [pyStatus, setPyStatus]   = useState<'idle' | 'loading' | 'ready'>('idle');
  const codeRef = useRef(code);
  codeRef.current = code;

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const template = STARTER_TEMPLATES[lang] ?? '';
    setCode(template);
    codeRef.current = template;
    setOutput(null);
    setExecError(null);
    setPyStatus('idle');
    onCodeChange({ code: template, language: lang });
  };

  const handleCodeChange = useCallback((val: string | undefined) => {
    const newCode = val ?? '';
    setCode(newCode);
    codeRef.current = newCode;
    onCodeChange({ code: newCode, language, output: output ?? undefined, error: execError ?? undefined });
  }, [language, output, execError, onCodeChange]);

  const runCode = async () => {
    const currentCode = codeRef.current;
    if (!currentCode.trim() || isRunning) return;

    setIsRunning(true);
    setOutput(null);
    setExecError(null);

    try {
      let result: { output: string; error: string; executionTime: number };

      if (language === 'python') {
        if (pyStatus === 'idle') setPyStatus('loading');
        result = await executePython(currentCode);
        setPyStatus('ready');
      } else {
        const res = await fetch('/api/code/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: currentCode, language }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Execution failed');
        result = { output: data.output || '', error: data.error || '', executionTime: data.executionTime };
      }

      setOutput(result.output || (result.error ? '' : '(no output)'));
      setExecError(result.error || null);
      setExecTime(result.executionTime);
      onCodeChange({
        code:          currentCode,
        language,
        output:        result.output,
        error:         result.error,
        executionTime: result.executionTime,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      setExecError(msg);
      onCodeChange({ code: currentCode, language, error: msg });
    } finally {
      setIsRunning(false);
    }
  };

  const monacoLang = language === 'cpp' ? 'cpp' : language;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Language:</span>
          {CODE_LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleLanguageChange(opt.value)}
              disabled={disabled}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                ${language === opt.value
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800/60 text-slate-500 border-slate-700/40 hover:text-slate-300 hover:border-slate-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {pyStatus === 'loading' && (
            <span className="text-xs text-amber-400/80 flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading Python runtime…
            </span>
          )}
          {pyStatus === 'ready' && (
            <span className="text-xs text-emerald-400/70">🐍 Python ready</span>
          )}

          <button
            onClick={runCode}
            disabled={isRunning || disabled || !code.trim()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30
              text-sm font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {pyStatus === 'loading' ? 'Loading…' : 'Running…'}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run
              </>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-700/50">
        <MonacoEditor
          height="280px"
          language={monacoLang}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            tabSize: 2,
            wordWrap: 'on',
            readOnly: disabled,
            automaticLayout: true,
          }}
        />
      </div>

      {(output !== null || execError) && (
        <div className={`rounded-xl border p-3 text-xs font-mono
          ${execError
            ? 'bg-red-500/5 border-red-500/20'
            : 'bg-slate-900/60 border-slate-700/40'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${execError ? 'text-red-400' : 'text-emerald-400'}`}>
              {execError ? '✗ Error' : '✓ Output'}
            </span>
            {execTime != null && execTime > 0 && (
              <span className="text-slate-600">{execTime}ms</span>
            )}
          </div>
          <pre className={`whitespace-pre-wrap break-words leading-relaxed
            ${execError ? 'text-red-300' : 'text-slate-300'}`}>
            {execError || output}
          </pre>
        </div>
      )}
    </div>
  );
}
