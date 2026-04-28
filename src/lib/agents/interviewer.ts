import { ollamaChat } from './base';
import { getRoundSystemPrompt, ROUND_META } from '../interview-config';
import { Question, RoundType } from '../types';

const AGENT_PERSONA = `You are a technical interviewer. Generate one interview question and return ONLY a JSON object.

Return exactly this JSON structure (no extra text, no markdown, no explanation):
{
  "id": "q1",
  "text": "Your full interview question goes here as a complete sentence?",
  "category": "resume",
  "difficulty": 5,
  "hint": "Key points a strong answer should cover",
  "focusArea": "The specific skill being tested",
  "followUpHint": null,
  "evaluationCriteria": ["criterion 1", "criterion 2", "criterion 3"],
  "hasCodingChallenge": false
}

The "text" field must contain the complete interview question. Do not nest this object inside another key.`;

export interface InterviewerInput {
  round: RoundType;
  targetRole: string;
  experienceLevel: string;
  resumeContext: string;
  currentDifficulty: number;
  questionNumberInRound: number;
  maxQuestionsInRound: number;
  previousQuestions: string[];
}

export async function InterviewerAgent(input: InterviewerInput): Promise<Question> {
  const roundMeta = ROUND_META[input.round];
  const roundInstructions = getRoundSystemPrompt(input.round, input.targetRole, input.experienceLevel);

  const prevList = input.previousQuestions.length
    ? input.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : 'None — this is the first question.';

  const userMessage = `
ROUND: ${roundMeta.name} (${input.round})
ROUND INSTRUCTIONS:
${roundInstructions}

CANDIDATE RESUME CONTEXT (semantically retrieved for this round):
${input.resumeContext}

TARGET ROLE: ${input.targetRole}
EXPERIENCE LEVEL: ${input.experienceLevel}

SESSION STATE:
- Question ${input.questionNumberInRound} of ${input.maxQuestionsInRound} in this round
- Current difficulty: ${input.currentDifficulty}/10

QUESTIONS ALREADY ASKED IN THIS ROUND (do not repeat these topics):
${prevList}

Generate the next question now. Make it specific to this candidate's background.
`.trim();

  const raw = await ollamaChat<Record<string, unknown>>(AGENT_PERSONA, userMessage, 0.4);
  console.log('[InterviewerAgent] raw response:', JSON.stringify(raw));

  const result = {
    ...raw,

    text: (raw.text ?? raw.question ?? raw.question_text ?? raw.content ?? raw.question_content ?? '') as string,
  } as Question;

  if (!result.text || typeof result.text !== 'string' || result.text.trim() === '') {
    throw new Error(`LLM returned unusable question. Raw keys: ${Object.keys(raw).join(', ')}`);
  }

  const CODING_ROUNDS: import('../types').RoundType[] = ['dsa', 'lld', 'sql'];

  result.id                 = `${input.round}_${input.questionNumberInRound}_${Date.now()}`;
  result.category           = input.round;
  result.difficulty         = (typeof result.difficulty === 'number' ? result.difficulty : input.currentDifficulty) as import('../types').DifficultyLevel;
  result.evaluationCriteria = Array.isArray(result.evaluationCriteria) ? result.evaluationCriteria : [];
  result.hasCodingChallenge = CODING_ROUNDS.includes(input.round) ? true : (result.hasCodingChallenge ?? false);
  result.hint               = result.hint ?? '';
  result.focusArea          = result.focusArea ?? roundMeta.name;

  return result;
}
