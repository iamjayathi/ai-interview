import { ollamaChat } from './base';
import { ROUND_META } from '../interview-config';
import { AnswerEvaluation, Question, RoundType, CodeSubmission } from '../types';

const AGENT_PERSONA = `You are a senior technical interviewer and career coach evaluating a job candidate.
Your evaluations are honest, specific, and constructive — not generic praise.

EVALUATOR PRINCIPLES:
- Score based on the candidate's ACTUAL answer, not what you hoped they'd say
- Cite specific phrases from their answer in your feedback
- Distinguish between "missing depth" and "fundamentally wrong"
- For coding rounds: assess both correctness AND code quality
- Calibrate scores to the difficulty level and experience expected

SCORING RUBRIC:
- 90-100: Exceptional — precise, deep, clear examples, proactive on trade-offs
- 70-89: Good — covers key points, minor gaps or vagueness
- 50-69: Adequate — misses important depth or has 1-2 factual errors
- 30-49: Weak — vague, superficial, or missing critical concepts
- 0-29: Insufficient — off-topic, fundamentally wrong, or essentially no answer

RESPONSE CONTRACT:
Always respond with valid JSON matching this schema exactly:
{
  "score": 75,
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific gap 1", "specific gap 2"],
  "feedback": "string (2-3 sentences, honest, references their actual words)",
  "suggestedImprovement": "string (the single most impactful thing to add)",
  "confidenceScore": 80,
  "needsFollowUp": false,
  "followUpQuestion": null
}`;

const HEDGES = ['i think','maybe',"i'm not sure",'i guess','possibly','kind of','sort of','not really sure','i believe so'];

function confidenceHeuristic(answer: string): number {
  const lower = answer.toLowerCase();
  const hedgeCount = HEDGES.filter((h) => lower.includes(h)).length;
  const wordCount   = answer.split(/\s+/).filter(Boolean).length;
  const tooShort    = wordCount < 30 ? 20 : 0;
  return Math.max(0, Math.min(100, 100 - hedgeCount * 12 - tooShort));
}

export interface EvaluatorInput {
  question: Question;
  answer: string;
  responseTime: number;
  round: RoundType;
  targetRole: string;
  experienceLevel: string;
  code?: CodeSubmission;
}

export async function EvaluatorAgent(input: EvaluatorInput): Promise<AnswerEvaluation> {
  const roundMeta  = ROUND_META[input.round];
  const confidence = confidenceHeuristic(input.answer);
  const wordCount  = input.answer.split(/\s+/).filter(Boolean).length;

  const codeSection = input.code
    ? `\nCODE SUBMISSION (${input.code.language}):\n\`\`\`\n${input.code.code}\n\`\`\`\nExecution stdout : ${input.code.output ?? '(not run)'}\nExecution stderr : ${input.code.error  ?? 'none'}`
    : '';

  const userMessage = `
EVALUATION CONTEXT:
- Target Role     : ${input.targetRole}
- Experience Level: ${input.experienceLevel}
- Round           : ${roundMeta.name}
- Difficulty      : ${input.question.difficulty}/10
- Evaluation focus: ${input.question.evaluationCriteria?.join(', ') ?? input.question.hint}

QUESTION:
${input.question.text}

CANDIDATE ANSWER (${wordCount} words, ${input.responseTime}s response time):
"${input.answer}"
${codeSection}

LANGUAGE CONFIDENCE SIGNALS: ${confidence}/100 (pre-computed from hedging word frequency)

Evaluate the answer now. Be specific — cite actual phrases from their response.
`.trim();

  const result = await ollamaChat<AnswerEvaluation>(AGENT_PERSONA, userMessage, 0.3);

  if (Math.abs(result.confidenceScore - confidence) > 40) {
    result.confidenceScore = Math.round((result.confidenceScore + confidence) / 2);
  }

  return result;
}
