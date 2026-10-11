import type { WinItem } from './draw-store';

export interface MatchWin {
  bondNumber: string;
  wins: WinItem[];
  totalPrize: number;
  hasExpiredOnly: boolean;
}

export interface MatchResult {
  totalChecked: number;
  totalWinnersCount: number; // Count of unique winning bond numbers
  totalPrizeAmount: number;
  matches: MatchWin[];
  durationMs: number;
}

/**
 * Pure matcher function.
 * Given an array of normalized 7-digit bond numbers and the in-memory index,
 * computes all winning bonds, total prize amounts, and claim status.
 */
export function checkBonds(
  bondNumbers: string[],
  index: Map<string, WinItem[]>
): MatchResult {
  const startTime = performance.now();
  const matches: MatchWin[] = [];
  let totalPrizeAmount = 0;

  for (const num of bondNumbers) {
    const wins = index.get(num);
    if (wins && wins.length > 0) {
      const sum = wins.reduce((acc, w) => acc + w.amount, 0);
      const hasExpiredOnly = wins.every((w) => w.isExpired);

      totalPrizeAmount += sum;
      matches.push({
        bondNumber: num,
        wins,
        totalPrize: sum,
        hasExpiredOnly,
      });
    }
  }

  // Sort matches descending by totalPrize
  matches.sort((a, b) => b.totalPrize - a.totalPrize);

  const durationMs = Math.round(performance.now() - startTime);

  return {
    totalChecked: bondNumbers.length,
    totalWinnersCount: matches.length,
    totalPrizeAmount,
    matches,
    durationMs,
  };
}
