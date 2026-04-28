import { ResumeData, ResumeChunk, RoundType } from './types';
import { embedTexts } from './embeddings';
import { storeFromChunks, semanticSearch } from './vectorstore';

export function buildResumeChunks(resume: ResumeData): ResumeChunk[] {
  const chunks: ResumeChunk[] = [];

  const skills     = resume.skills     ?? [];
  const experience = resume.experience ?? [];
  const projects   = resume.projects   ?? [];
  const education  = resume.education  ?? [];

  if (skills.length > 0) {
    chunks.push({
      id: 'skills',
      type: 'skills',
      content: `Technical Skills: ${skills.join(', ')}`,
      keywords: skills.map((s) => s.toLowerCase()),
      relevantRounds: ['resume', 'dsa', 'lld', 'hld', 'sql', 'statistics'],
    });
  }

  if (resume.summary) {
    chunks.push({
      id: 'summary',
      type: 'summary',
      content: `Professional Summary: ${resume.summary}`,
      keywords: extractKeywords(resume.summary),
      relevantRounds: ['resume', 'behavioral'],
    });
  }

  experience.forEach((exp, i) => {
    const highlights = exp.highlights ?? [];
    const content = [
      `${exp.role ?? 'Role'} at ${exp.company ?? 'Company'} (${exp.duration ?? ''})`,
      ...highlights.map((h) => `• ${h}`),
    ].join('\n');
    chunks.push({
      id: `experience_${i}`,
      type: 'experience',
      content,
      keywords: [
        ...extractKeywords(exp.role ?? ''),
        ...extractKeywords(exp.company ?? ''),
        ...highlights.flatMap((h) => extractKeywords(h)),
      ],
      relevantRounds: ['resume', 'behavioral', 'hld', 'lld'],
    });
  });

  projects.forEach((proj, i) => {
    const technologies = proj.technologies ?? [];
    chunks.push({
      id: `project_${i}`,
      type: 'project',
      content: [
        `Project: ${proj.name ?? 'Project'}`,
        proj.description ?? '',
        technologies.length > 0 ? `Technologies: ${technologies.join(', ')}` : '',
      ].filter(Boolean).join('\n'),
      keywords: [
        ...extractKeywords(proj.name ?? ''),
        ...extractKeywords(proj.description ?? ''),
        ...technologies.map((t) => t.toLowerCase()),
      ],
      relevantRounds: ['resume', 'dsa', 'lld', 'hld'],
    });
  });

  education.forEach((edu, i) => {
    chunks.push({
      id: `education_${i}`,
      type: 'education',
      content: `${edu.degree ?? 'Degree'} from ${edu.institution ?? 'Institution'} (${edu.year ?? ''})`,
      keywords: extractKeywords(`${edu.degree ?? ''} ${edu.institution ?? ''}`),
      relevantRounds: ['resume', 'behavioral'],
    });
  });

  return chunks;
}

export async function embedResumeChunks(chunks: ResumeChunk[]): Promise<ResumeChunk[]> {
  const texts = chunks.map((c) => c.content);
  const embeddings = await embedTexts(texts);
  return chunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));
}

export async function embedAndSearch(
  chunks: ResumeChunk[],
  round: RoundType,
  query: string,
  k = 4
): Promise<string> {
  const hasEmbeddings = chunks.some((c) => c.embedding && c.embedding.length > 0);

  if (hasEmbeddings) {
    const store = await storeFromChunks(chunks);
    const results = await semanticSearch(store, query, round, k);
    return results.join('\n\n');
  }

  return retrieveContext(chunks, round, k);
}

export function retrieveContext(
  chunks: ResumeChunk[],
  round: RoundType,
  maxChunks = 4
): string {
  const relevant = chunks.filter((c) => c.relevantRounds.includes(round));
  const selected = relevant.slice(0, maxChunks);
  if (selected.length === 0) return chunks.slice(0, 2).map((c) => c.content).join('\n\n');
  return selected.map((c) => c.content).join('\n\n');
}

function extractKeywords(text: string): string[] {
  const stop = new Set([
    'and','the','with','for','from','using','a','an','in','on','at','to','of',
    'by','is','was','are','were','be','been','have','has','had','do','does',
    'did','will','would','could','should','may','might','i','we','you','my','our',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
}
