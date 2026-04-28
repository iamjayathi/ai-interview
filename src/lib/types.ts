export type RoleType = 'SDE' | 'PM' | 'DATA_ANALYST';

export type RoundType =
  | 'resume'
  | 'dsa'
  | 'lld'
  | 'hld'
  | 'behavioral'
  | 'product_sense'
  | 'metrics'
  | 'case_study'
  | 'sql'
  | 'statistics';

export type QuestionCategory = RoundType;
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface ResumeData {
  name: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  summary?: string;
  rawText: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface ResumeChunk {
  id: string;
  type: 'skills' | 'experience' | 'project' | 'education' | 'summary';
  content: string;
  keywords: string[];
  relevantRounds: RoundType[];

  embedding?: number[];
}

export interface Question {
  id: string;
  text: string;
  category: RoundType;
  difficulty: DifficultyLevel;
  hint: string;
  focusArea: string;
  followUpHint?: string;
  evaluationCriteria?: string[];
  hasCodingChallenge?: boolean;
  codeStarterTemplate?: string;
  codeLanguage?: string;
}

export interface CodeSubmission {
  code: string;
  language: string;
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface AnswerEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  suggestedImprovement: string;
  confidenceScore: number;
  needsFollowUp: boolean;
  followUpQuestion?: string;
}

export interface InterviewQA {
  question: Question;
  answer: string;
  code?: CodeSubmission;
  responseTime: number;
  evaluation: AnswerEvaluation;
  timestamp: number;
  round: RoundType;
}

export interface InterviewState {
  sessionId: string;
  resumeData: ResumeData;
  resumeChunks: ResumeChunk[];
  targetRole: string;
  role: RoleType;
  rounds: RoundType[];
  currentRoundIndex: number;
  currentRound: RoundType;
  history: InterviewQA[];
  currentDifficulty: DifficultyLevel;
  questionCount: number;
  maxQuestionsPerRound: number;
  pressureMode: boolean;
  pressureTimeLimit: number;
  startedAt: number;
  roundScores: Partial<Record<RoundType, number>>;
}

export interface InterviewSummary {
  overallScore: number;
  roundScores: Partial<Record<RoundType, number>>;
  weakAreas: string[];
  strongAreas: string[];
  recommendations: string[];
  overallFeedback: string;
  totalTime: number;
  averageResponseTime: number;
  difficultyProgression: number[];
  scoreProgression: number[];
}

export interface InterviewConfig {
  targetRole: string;
  role: RoleType;
  maxQuestionsPerRound: number;
  pressureMode: boolean;
  pressureTimeLimit: number;
}
