import type { Goal, HealthParts, Spent } from "./types";

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Decomposable 0–100 steadiness signal. Neutral by design — a signal, not a grade.
 *
 * Four visible parts, each normalized to 0–100:
 * 1. Liquidity: `balance / (2 × bufferTarget)` — 100 once the balance sits
 *    comfortably above twice the buffer; falls linearly toward 0.
 * 2. Commitment: `1 − committedAhead / balance` — lower upcoming bills score
 *    higher; a zero/negative balance scores 0.
 * 3. Goal: `(saved / target)` measured against `(elapsed / totalDays)` — ahead
 *    of schedule scores toward 100, behind schedule proportionally less.
 * 4. Steadiness: inverse of the coefficient of variation across days that have
 *    spending (`1 − cv / 2`) — even days score high, one huge day next to
 *    quiet ones scores low. Fewer than two active days returns a neutral 80.
 *
 * Overall is the plain mean of the four parts, rounded.
 */
export function calcHealth(
  balance: number,
  committedAhead: number,
  bufferTarget: number,
  goal: Goal,
  spent: Spent[],
  currentDay: number,
  totalDays: number,
): HealthParts {
  const liquidity =
    bufferTarget <= 0
      ? 100
      : Math.round(clamp01(balance / (bufferTarget * 2)) * 100);

  const ratio = balance > 0 ? committedAhead / balance : 1;
  const commitment = Math.round(clamp01(1 - ratio) * 100);

  const elapsed = Math.max(0, currentDay - 1);
  const expected = totalDays > 0 ? elapsed / totalDays : 0;
  const actual = goal.target > 0 ? goal.saved / goal.target : 0;
  const goalScore =
    expected <= 0.02
      ? Math.round(clamp01(actual) * 100)
      : Math.round(clamp01(actual / Math.max(expected, 0.05)) * 100);

  const byDay = new Map<number, number>();
  for (const s of spent) byDay.set(s.day, (byDay.get(s.day) ?? 0) + s.amount);
  const active = [...byDay.values()].filter((v) => v > 0);
  let steadiness: number;
  if (active.length < 2) {
    steadiness = 80;
  } else {
    const mean = active.reduce((a, b) => a + b, 0) / active.length;
    if (mean <= 0) {
      steadiness = 80;
    } else {
      const variance =
        active.reduce((a, b) => a + (b - mean) * (b - mean), 0) / active.length;
      const cv = Math.sqrt(variance) / mean;
      steadiness = Math.round(clamp01(1 - cv / 2) * 100);
    }
  }

  const overall = Math.round((liquidity + commitment + goalScore + steadiness) / 4);
  return { liquidity, commitment, goal: goalScore, steadiness, overall };
}
