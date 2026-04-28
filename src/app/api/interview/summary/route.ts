import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/interview';
import { InterviewState } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { state }: { state: InterviewState } = await request.json();

    if (!state || state.history.length === 0) {
      return NextResponse.json({ error: 'No interview history to summarize' }, { status: 400 });
    }

    const summary = await generateSummary(state);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary. Please try again.' },
      { status: 500 }
    );
  }
}
