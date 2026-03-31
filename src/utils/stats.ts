import { PlayerStats, TurnRecord, Category } from '../types';

/**
 * Determines the winner from player stats.
 * Rule: fewest fouls wins. Tiebreaker: most correct answers.
 * Returns null if a true tie exists.
 */
export function getWinner(
  playerStats: Record<string, PlayerStats>
): string | null {
  const players = Object.values(playerStats);
  if (players.length === 0) return null;

  const sorted = [...players].sort((a, b) => {
    if (a.fouls !== b.fouls) return a.fouls - b.fouls; // fewer fouls wins
    return b.correct - a.correct; // more correct answers wins
  });

  // Check for tie between top two
  if (
    sorted.length > 1 &&
    sorted[0].fouls === sorted[1].fouls &&
    sorted[0].correct === sorted[1].correct
  ) {
    return null; // tie
  }

  return sorted[0].id;
}

/**
 * Returns the category where a player had the most correct answers.
 */
export function getBestCategory(stats: PlayerStats): Category | null {
  const categories: Category[] = ['animals', 'countries', 'cities'];
  let best: Category | null = null;
  let bestCount = 0;

  for (const cat of categories) {
    const count = stats.categoryCorrect[cat];
    if (count > bestCount) {
      bestCount = count;
      best = cat;
    }
  }

  return best;
}

/**
 * Returns the letter that caused the most fouls for a player.
 * We track letter history, so we find letters that appear in foul turns.
 */
export function getHardestLetter(
  turns: TurnRecord[],
  playerId: string
): string | null {
  const foulMap: Record<string, number> = {};

  for (const turn of turns) {
    if (turn.playerId === playerId && !turn.isCorrect) {
      foulMap[turn.letter] = (foulMap[turn.letter] ?? 0) + 1;
    }
  }

  const entries = Object.entries(foulMap);
  if (entries.length === 0) return null;

  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Computes average response time in ms for a player.
 */
export function getAverageResponseTime(stats: PlayerStats): number {
  if (stats.answerCount === 0) return 0;
  return stats.totalResponseTime / stats.answerCount;
}
