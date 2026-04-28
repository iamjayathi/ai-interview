export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { parseResume } from '@/lib/interview';
import { buildResumeChunks, embedResumeChunks } from '@/lib/rag';
import { activeProvider } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text as string;

    if (!pdfText || pdfText.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 });
    }

    const resumeData = await parseResume(pdfText);
    const rawChunks = buildResumeChunks(resumeData);

    try {
      const chunks = await embedResumeChunks(rawChunks);
      return NextResponse.json({
        resumeData,
        resumeChunks: chunks,
        meta: { semantic: true }
      });
    } catch (err) {
      // Fallback if embedding service is down
      return NextResponse.json({
        resumeData,
        resumeChunks: rawChunks,
        meta: { semantic: false }
      });
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to parse resume: ${message}` },
      { status: 500 }
    );
  }
}