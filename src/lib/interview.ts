import {
  ResumeData,
  InterviewState,
  Question,
  AnswerEvaluation,
  InterviewSummary,
  DifficultyLevel,
  CodeSubmission,
} from './types';
import { inferExperienceLevel, ROUND_META } from './interview-config';
import { embedAndSearch } from './rag';
import { InterviewerAgent } from './agents/interviewer';
import { EvaluatorAgent }   from './agents/evaluator';
import { CoachAgent }       from './agents/coach';
import { getLLMConfig }     from './agents/base';

export async function parseResume(pdfText: string): Promise<ResumeData> {
  const { url, headers, model } = getLLMConfig();
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.1,
      stream: false,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume parser. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: `Parse this resume and return a JSON object with this exact schema:
{
  "name": "Full Name",
  "email": "email or null",
  "phone": "phone or null",
  "summary": "brief professional summary or null",
  "skills": ["skill1", "skill2"],
  "experience": [
    { "company": "Name", "role": "Title", "duration": "Jan 2022 - Present", "highlights": ["achievement 1"] }
  ],
  "education": [
    { "institution": "University", "degree": "BS Computer Science", "year": "2022" }
  ],
  "projects": [
    { "name": "Project", "description": "Description", "technologies": ["React", "Node.js"] }
  ]
}

Resume text:
${pdfText}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM parse-resume ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = parseJSON<Omit<ResumeData, 'rawText'>>(text);
  return {
    ...parsed,
    skills:     Array.isArray(parsed.skills)     ? parsed.skills     : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    projects:   Array.isArray(parsed.projects)   ? parsed.projects   : [],
    education:  Array.isArray(parsed.education)  ? parsed.education  : [],
    rawText: pdfText,
  };
}

export async function generateQuestion(state: InterviewState): Promise<Question> {
  const round           = state.currentRound;
  const experienceLevel = inferExperienceLevel(state.resumeData);
  const roundMeta       = ROUND_META[round];

  const query = `${roundMeta.name} ${roundMeta.evaluationFocus.join(' ')} ${state.targetRole}`;
  const resumeContext = await embedAndSearch(state.resumeChunks, round, query, 4);

  const roundHistory     = state.history.filter((h) => h.round === round);
  const previousQuestions = roundHistory.map((h) => h.question.text);

  return InterviewerAgent({
    round,
    targetRole:            state.targetRole,
    experienceLevel,
    resumeContext,
    currentDifficulty:     state.currentDifficulty,
    questionNumberInRound: roundHistory.length + 1,
    maxQuestionsInRound:   state.maxQuestionsPerRound,
    previousQuestions,
  });
}

export async function evaluateAnswer(
  question:     Question,
  answer:       string,
  responseTime: number,
  state:        InterviewState,
  code?:        CodeSubmission
): Promise<AnswerEvaluation> {
  return EvaluatorAgent({
    question,
    answer,
    responseTime,
    round:           state.currentRound,
    targetRole:      state.targetRole,
    experienceLevel: inferExperienceLevel(state.resumeData),
    code,
  });
}

export async function generateSummary(state: InterviewState): Promise<InterviewSummary> {
  return CoachAgent(state);
}

export function adjustDifficulty(
  currentDifficulty: DifficultyLevel,
  recentScores:      number[]
): DifficultyLevel {
  if (recentScores.length === 0) return currentDifficulty;
  const window = recentScores.slice(-3);
  const avg    = window.reduce((a, b) => a + b, 0) / window.length;
  let next: number = currentDifficulty;
  if (avg >= 80) next = Math.min(10, currentDifficulty + 1);
  else if (avg < 50) next = Math.max(1, currentDifficulty - 1);
  return next as DifficultyLevel;
}

function parseJSON<T>(text: string): T {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const raw   = match ? match[1] : text.trim();
    const start = raw.search(/[\[{]/);
    if (start !== -1) return JSON.parse(raw.slice(start));
    throw new Error(`Failed to parse AI response: ${text.slice(0, 200)}`);
  }
}
