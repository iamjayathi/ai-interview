import { InterviewState, RoundType } from './types';

export function computeRoundScore(
  history: InterviewState['history'],
  round: RoundType
): number {
  const roundQAs = history.filter((h) => h.round === round);
  if (roundQAs.length === 0) return 0;
  return Math.round(
    roundQAs.reduce((sum, qa) => sum + qa.evaluation.score, 0) / roundQAs.length
  );
}
