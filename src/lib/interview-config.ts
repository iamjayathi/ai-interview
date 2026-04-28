import { RoleType, RoundType } from './types';

export interface RoundMeta {
  id: RoundType;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  hasCoding: boolean;
  evaluationFocus: string[];
  systemPromptKey: string;
}

export const ROUND_META: Record<RoundType, RoundMeta> = {
  resume: {
    id: 'resume',
    name: 'Resume Deep Dive',
    shortName: 'Resume',
    description: 'Projects, tech choices, and trade-offs from your experience',
    icon: '📄',
    hasCoding: false,
    evaluationFocus: ['technical depth', 'decision-making', 'ownership'],
    systemPromptKey: 'RESUME',
  },
  dsa: {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    description: 'Algorithmic problem solving with live coding',
    icon: '⚡',
    hasCoding: true,
    evaluationFocus: ['correctness', 'time/space complexity', 'code quality'],
    systemPromptKey: 'DSA',
  },
  lld: {
    id: 'lld',
    name: 'Low-Level Design',
    shortName: 'LLD',
    description: 'OOP design, class structures, design patterns',
    icon: '🧱',
    hasCoding: true,
    evaluationFocus: ['class design', 'SOLID principles', 'extensibility'],
    systemPromptKey: 'LLD',
  },
  hld: {
    id: 'hld',
    name: 'System Design',
    shortName: 'HLD',
    description: 'Large-scale distributed systems architecture',
    icon: '🏗️',
    hasCoding: false,
    evaluationFocus: ['scalability', 'database choices', 'trade-offs'],
    systemPromptKey: 'HLD',
  },
  behavioral: {
    id: 'behavioral',
    name: 'Behavioral',
    shortName: 'Behavioral',
    description: 'Leadership, conflict, and situational judgment',
    icon: '🤝',
    hasCoding: false,
    evaluationFocus: ['STAR structure', 'self-awareness', 'impact'],
    systemPromptKey: 'BEHAVIORAL',
  },
  product_sense: {
    id: 'product_sense',
    name: 'Product Sense',
    shortName: 'Product',
    description: 'Product thinking, user empathy, prioritization',
    icon: '💡',
    hasCoding: false,
    evaluationFocus: ['user empathy', 'framework clarity', 'creativity'],
    systemPromptKey: 'PRODUCT_SENSE',
  },
  metrics: {
    id: 'metrics',
    name: 'Metrics & Analytics',
    shortName: 'Metrics',
    description: 'Defining success metrics, A/B testing, data interpretation',
    icon: '📊',
    hasCoding: false,
    evaluationFocus: ['metric definition', 'experimentation', 'trade-offs'],
    systemPromptKey: 'METRICS',
  },
  case_study: {
    id: 'case_study',
    name: 'Case Study',
    shortName: 'Case',
    description: 'Structured problem-solving and estimation',
    icon: '🔍',
    hasCoding: false,
    evaluationFocus: ['structure', 'assumptions', 'quantitative reasoning'],
    systemPromptKey: 'CASE_STUDY',
  },
  sql: {
    id: 'sql',
    name: 'SQL & Data Querying',
    shortName: 'SQL',
    description: 'Query writing, optimization, and data manipulation',
    icon: '🗄️',
    hasCoding: true,
    evaluationFocus: ['query correctness', 'optimization', 'joins/aggregations'],
    systemPromptKey: 'SQL',
  },
  statistics: {
    id: 'statistics',
    name: 'Statistics & Probability',
    shortName: 'Stats',
    description: 'Statistical concepts, distributions, hypothesis testing',
    icon: '📈',
    hasCoding: false,
    evaluationFocus: ['conceptual clarity', 'application', 'interpretation'],
    systemPromptKey: 'STATISTICS',
  },
};

export interface RoleConfig {
  id: RoleType;
  name: string;
  description: string;
  icon: string;
  tagline: string;
  rounds: RoundType[];
  defaultRole: string;
}

export const ROLE_CONFIGS: Record<RoleType, RoleConfig> = {
  SDE: {
    id: 'SDE',
    name: 'Software Engineer',
    description: 'Full interview loop for SDE/SWE roles',
    icon: '💻',
    tagline: 'DSA · System Design · Low-Level Design',
    rounds: ['resume', 'dsa', 'lld', 'hld', 'behavioral'],
    defaultRole: 'Software Engineer',
  },
  PM: {
    id: 'PM',
    name: 'Product Manager',
    description: 'PM-focused loop: product sense to execution',
    icon: '🎯',
    tagline: 'Product Sense · Metrics · Case Study',
    rounds: ['resume', 'product_sense', 'metrics', 'case_study', 'behavioral'],
    defaultRole: 'Product Manager',
  },
  DATA_ANALYST: {
    id: 'DATA_ANALYST',
    name: 'Data Analyst',
    description: 'Analytics-focused: SQL, stats, and business cases',
    icon: '📊',
    tagline: 'SQL · Statistics · Case Study',
    rounds: ['resume', 'sql', 'statistics', 'case_study', 'behavioral'],
    defaultRole: 'Data Analyst',
  },
};

export function getRoundSystemPrompt(
  round: RoundType,
  role: string,
  experienceLevel: string
): string {
  const base = `You are an expert technical interviewer conducting a structured interview.
Candidate is applying for: ${role}
Experience Level: ${experienceLevel}
Current Round: ${ROUND_META[round].name}

CORE RULES:
- Ask ONE question at a time
- Be concise and professional (like a real interviewer)
- If answer is weak → ask a probing follow-up
- If answer is strong → increase difficulty
- If candidate is stuck → give small hints, not full solutions
- Adapt difficulty based on responses

Always respond with valid JSON only, using this exact structure:
{
  "question": "The next question to ask",
  "followUpHint": "Optional hint if candidate seems stuck (or null)",
  "evaluationCriteria": ["criterion 1", "criterion 2", "criterion 3"],
  "difficulty": "easy | medium | hard",
  "focusArea": "Specific skill being tested",
  "hasCodingChallenge": false
}`;

  const roundInstructions: Record<RoundType, string> = {
    resume: `ROUND INSTRUCTIONS - Resume Deep Dive:
- Ask ONLY about their actual resume (projects, tech choices, decisions)
- Dig into WHY they chose certain technologies
- Ask about challenges, failures, and lessons learned
- Probe trade-offs they made`,

    dsa: `ROUND INSTRUCTIONS - DSA:
- Present ONE algorithmic problem clearly
- Ask candidate to think aloud through their approach
- Probe time and space complexity
- If asking a coding question, set hasCodingChallenge: true
- Provide a starter template idea in the question text
- Common topics: arrays, trees, graphs, DP, sliding window`,

    lld: `ROUND INSTRUCTIONS - Low-Level Design:
- Ask to design a system class structure (e.g., Parking Lot, LRU Cache, Rate Limiter)
- Evaluate OOP principles, SOLID, design patterns
- Ask about edge cases and scalability
- Set hasCodingChallenge: true for implementation questions`,

    hld: `ROUND INSTRUCTIONS - System Design:
- Ask large-scale system design (e.g., design Twitter, Uber, WhatsApp)
- Focus on: architecture, DB choice, caching, CDN, load balancing
- Challenge their assumptions
- Ask about bottlenecks and trade-offs`,

    behavioral: `ROUND INSTRUCTIONS - Behavioral:
- Use STAR method framework
- Ask about real situations: conflict, failure, leadership, ambiguity
- Dig deeper with "what did YOU specifically do?"
- Evaluate: self-awareness, accountability, impact`,

    product_sense: `ROUND INSTRUCTIONS - Product Sense:
- Ask to improve/design a product feature
- Evaluate: user empathy, prioritization, metrics definition
- Ask "how would you measure success?"
- Challenge assumptions about users`,

    metrics: `ROUND INSTRUCTIONS - Metrics & Analytics:
- Ask to define success metrics for a feature
- Cover: north star metric, guardrail metrics, A/B testing design
- Ask about metric trade-offs and edge cases`,

    case_study: `ROUND INSTRUCTIONS - Case Study:
- Present a business/estimation problem
- Ask candidate to structure their approach before solving
- Probe assumptions explicitly
- Evaluate quantitative reasoning`,

    sql: `ROUND INSTRUCTIONS - SQL:
- Present a realistic data schema, then ask a query question
- Set hasCodingChallenge: true
- Cover: JOINs, aggregations, window functions, CTEs, optimization
- Ask about query performance`,

    statistics: `ROUND INSTRUCTIONS - Statistics:
- Ask about distributions, hypothesis testing, confidence intervals
- Present real-world scenarios (e.g., "how would you detect an anomaly in metrics?")
- Probe conceptual understanding before formulas`,
  };

  return `${base}\n\n${roundInstructions[round]}`;
}

export function inferExperienceLevel(resumeData: { experience: { duration: string }[] }): string {
  const totalYears = resumeData.experience.reduce((sum, exp) => {
    const match = exp.duration.match(/(\d+)\s*year/i);
    return sum + (match ? parseInt(match[1]) : 1);
  }, 0);

  if (totalYears <= 1) return '0-1 years (Entry Level)';
  if (totalYears <= 3) return '2-3 years (Junior)';
  if (totalYears <= 6) return '4-6 years (Mid-Level)';
  if (totalYears <= 10) return '7-10 years (Senior)';
  return '10+ years (Staff/Principal)';
}

export const CODE_LANGUAGE_OPTIONS = [
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'Go', value: 'go' },
  { label: 'SQL', value: 'sql' },
];
