import { ollamaChat } from './base';
import { ROUND_META } from '../interview-config';
import { InterviewState, InterviewSummary, RoundType } from '../types';
import { computeRoundScore } from '../interview-utils';

const AGENT_PERSONA = `You are an expert technical interview coach with 15 years of experience
helping engineers land roles at top technology companies.

COACHING PRINCIPLES:
- Be honest about weaknesses — candidates improve faster with honest feedback
- Prioritize the most impactful improvement areas (not just list everything)
- Recommend specific, actionable practice (not vague "study more")
- Recognize genuine strengths so candidates know what to leverage
- Frame feedback around what the INTERVIEWER actually looks for

RESPONSE CONTRACT:
Always respond with valid JSON matching this schema exactly:
{
  "overallScore": 75,
  "weakAreas": ["specific gap 1", "specific gap 2", "specific gap 3"],
  "strongAreas": ["demonstrated strength 1", "demonstrated strength 2"],
  "recommendations": [
    "Specific actionable improvement 1 (with concrete practice suggestion)",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3"
  ],
  "overallFeedback": "string (3-4 sentences, holistic, mentor-style, honest)"
}`;

export async function CoachAgent(state: InterviewState): Promise<InterviewSummary> {
  const totalTime       = Math.round((Date.now() - state.startedAt) / 1000);
  const avgResponseTime = state.history.length > 0
    ? Math.round(state.history.reduce((a, b) => a + b.responseTime, 0) / state.history.length)
    : 0;

  const roundScores: Partial<Record<RoundType, number>> = {};
  for (const round of state.rounds) {
    const s = computeRoundScore(state.history, round);
    if (s > 0) roundScores[round] = s;
  }

  const transcript = state.history
    .map((qa, i) => {
      const roundName = ROUND_META[qa.round].shortName;
      const codeNote  = qa.code
        ? `\n  Code (${qa.code.language}): ${qa.code.code.slice(0, 120)}...`
        : '';
      return [
        `Q${i + 1} [${roundName} · D${qa.question.difficulty}]: ${qa.question.text}`,
        `  Answer (${qa.responseTime}s, ${qa.answer.split(/\s+/).length}w): "${qa.answer.slice(0, 180)}${qa.answer.length > 180 ? '…' : ''}"`,
        codeNote,
        `  Score: ${qa.evaluation.score}/100`,
        `  Feedback: ${qa.evaluation.feedback}`,
        `  Key gap: ${qa.evaluation.suggestedImprovement}`,
      ].filter(Boolean).join('\n');
    })
    .join('\n\n');

  const roundSummary = Object.entries(roundScores)
    .map(([r, s]) => `  ${ROUND_META[r as RoundType].name}: ${s}/100`)
    .join('\n');

  const userMessage = `
INTERVIEW DEBRIEF:
Candidate: ${state.resumeData.name}
Role: ${state.targetRole}
Total time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s
Questions answered: ${state.history.length}
Average response time: ${avgResponseTime}s

ROUND SCORES:
${roundSummary || '(no rounds completed)'}

FULL Q&A TRANSCRIPT:
${transcript}

Produce a comprehensive coaching report now. Prioritize the 3 most impactful improvements.
`.trim();

  const raw = await ollamaChat<Omit<InterviewSummary, 'roundScores' | 'totalTime' | 'averageResponseTime' | 'difficultyProgression' | 'scoreProgression'>>(
    AGENT_PERSONA,
    userMessage,
    0.4,
  );

  return {
    ...raw,
    roundScores,
    totalTime,
    averageResponseTime: avgResponseTime,
    difficultyProgression: state.history.map((h) => h.question.difficulty),
    scoreProgression:      state.history.map((h) => h.evaluation.score),
  };
}
