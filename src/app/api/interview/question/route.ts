import { NextRequest, NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/interview';
import { InterviewState } from '@/lib/types';
import { checkRateLimit, getClientKey } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request.headers);
  const limit = checkRateLimit(clientKey, 'question');
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${limit.resetInSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(limit.resetInSeconds) } }
    );
  }

  try {
    const { state }: { state: InterviewState } = await request.json();

    if (!state?.resumeData || !state?.currentRound) {
      return NextResponse.json({ error: 'Invalid interview state' }, { status: 400 });
    }

    const question = await generateQuestion(state);
    return NextResponse.json({ question }, {
      headers: { 'X-RateLimit-Remaining': String(limit.remaining) },
    });
  } catch (error) {
    console.error('Question generation error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to generate question: ${message}` },
      { status: 500 }
    );
  }
}
