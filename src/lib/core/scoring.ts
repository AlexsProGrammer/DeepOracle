import { ORACLE_SCORE_EXACT, ORACLE_SCORE_PER_TRICK, ORACLE_SCORE_MISS } from './constants';

export function calculateRoundScore(bid: number, tricksWon: number): number {
  if (bid === tricksWon) {
    return ORACLE_SCORE_EXACT + ORACLE_SCORE_PER_TRICK * tricksWon;
  }
  const diff = Math.abs(tricksWon - bid);
  return -ORACLE_SCORE_MISS * diff;
}

export function calculateFinalScores(scores: number[]): number {
  return scores.reduce((sum, s) => sum + s, 0);
}
