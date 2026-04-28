import { NextRequest, NextResponse } from 'next/server';
import { evaluateAnswer, adjustDifficulty } from '@/lib/interview';
import { InterviewState, Question, DifficultyLevel, CodeSubmission } from '@/lib/types';
import { checkRateLimit, getClientKey } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request.headers);
  const limit = checkRateLimit(clientKey, 'evaluate');
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${limit.resetInSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(limit.resetInSeconds) } }
    );
  }

  try {
    const {
      state,
      question,
      answer,
      responseTime,
      code,
    }: {
      state: InterviewState;
      question: Question;
      answer: string;
      responseTime: number;
      code?: CodeSubmission;
    } = await request.json();

    if (!state || !question || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const evaluation = await evaluateAnswer(question, answer, responseTime, state, code);

    const recentScores = [
      ...state.history.map((h) => h.evaluation.score),
      evaluation.score,
    ];
    const newDifficulty = adjustDifficulty(
      state.currentDifficulty,
      recentScores
    ) as DifficultyLevel;

    return NextResponse.json({ evaluation, newDifficulty }, {
      headers: { 'X-RateLimit-Remaining': String(limit.remaining) },
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to evaluate answer: ${message}` },
      { status: 500 }
    );
  }
}
