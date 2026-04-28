export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File | null;

    if (!audio || audio.size === 0) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'en',
      temperature: 0,
    });

    return NextResponse.json({ transcript: transcription.text.trim() });
  } catch (error) {
    console.error('Transcription error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Transcription failed: ${message}` }, { status: 500 });
  }
}
