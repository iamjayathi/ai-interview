import { NextRequest, NextResponse } from 'next/server';
import { executeCode } from '@/lib/code-executor';
import { checkRateLimit, getClientKey } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request.headers);
  const limit = checkRateLimit(clientKey, 'execute');
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${limit.resetInSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const { code, language }: { code: string; language: string } = await request.json();

    if (!code || !language) {
      return NextResponse.json({ error: 'code and language are required' }, { status: 400 });
    }

    if (code.length > 50_000) {
      return NextResponse.json({ error: 'Code too long (max 50KB)' }, { status: 400 });
    }

    const result = await executeCode(code, language);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
