import vm from 'vm';

export interface ExecutionResult {
  output: string;
  error: string;
  executionTime: number;
  success: boolean;
}

function executeJavaScript(code: string): ExecutionResult {
  const logs: string[] = [];
  const start = Date.now();

  const sandbox = vm.createContext({
    console: {
      log:   (...a: unknown[]) => logs.push(a.map(stringify).join(' ')),
      error: (...a: unknown[]) => logs.push('[err] ' + a.map(stringify).join(' ')),
      warn:  (...a: unknown[]) => logs.push('[warn] ' + a.map(stringify).join(' ')),
      info:  (...a: unknown[]) => logs.push(a.map(stringify).join(' ')),
    },
    Math, JSON, Array, Object, String, Number, Boolean,
    Map, Set, Promise,
    parseInt, parseFloat, isNaN, isFinite,
    setTimeout: undefined, setInterval: undefined,
  });

  try {
    vm.runInContext(code, sandbox, { timeout: 5000 });
    return { output: logs.join('\n').trim(), error: '', executionTime: Date.now() - start, success: true };
  } catch (err) {
    return { output: logs.join('\n').trim(), error: err instanceof Error ? err.message : String(err), executionTime: Date.now() - start, success: false };
  }
}

function stringify(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'object') { try { return JSON.stringify(v, null, 2); } catch { return String(v); } }
  return String(v);
}

const WANDBOX_COMPILERS: Record<string, string> = {
  java: 'openjdk-jdk-22+36',
  cpp:  'gcc-13.2.0',
  go:   'go-1.22.1',
};

async function executeWithWandbox(code: string, language: string): Promise<ExecutionResult> {
  const compiler = WANDBOX_COMPILERS[language];
  if (!compiler) {
    return { output: '', error: `No Wandbox compiler configured for ${language}.`, executionTime: 0, success: false };
  }

  const start = Date.now();
  try {
    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, compiler, save: false }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { output: '', error: `Wandbox ${res.status}: ${text.slice(0, 200)}`, executionTime: Date.now() - start, success: false };
    }

    const data = await res.json();

    const compilerErr  = (data.compiler_error  ?? '').trim();
    const programOut   = (data.program_output  ?? '').trim();
    const programErr   = (data.program_error   ?? '').trim();
    const exitCode     = data.status;

    if (compilerErr) {
      return { output: '', error: compilerErr, executionTime: Date.now() - start, success: false };
    }

    return {
      output:        programOut,
      error:         programErr,
      executionTime: Date.now() - start,
      success:       exitCode === 0,
    };
  } catch (err) {
    return {
      output: '',
      error: `Wandbox connection error: ${err instanceof Error ? err.message : String(err)}`,
      executionTime: Date.now() - start,
      success: false,
    };
  }
}

export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  const lang = language.toLowerCase();

  if (lang === 'javascript' || lang === 'typescript') {
    return executeJavaScript(code);
  }

  if (lang === 'python') {
    return { output: '', error: 'Python runs in the browser. This server route should not be called for Python.', executionTime: 0, success: false };
  }

  if (WANDBOX_COMPILERS[lang]) {
    return executeWithWandbox(code, lang);
  }

  if (lang === 'sql') {
    return { output: '', error: 'SQL runs against a live schema. Write your query and submit — the AI will evaluate it.', executionTime: 0, success: false };
  }

  return { output: '', error: `Live execution is not configured for ${language}.`, executionTime: 0, success: false };
}
