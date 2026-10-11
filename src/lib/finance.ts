export interface Spent {
  id: string;
  label: string;
  amount: number;
  day: number;
}

export interface Commitment {
  id: string;
  label: string;
  amount: number;
  day: number;
  recurring?: string;
}

export interface Goal {
  id: string;
  label: string;
  target: number;
  saved: number;
  deadlineDay: number;
}

export interface Simulation {
  label: string;
  amount: number;
  day: number;
  recurring: boolean;
}

export function sumSpent(spent: Spent[]): number {
  return spent.reduce((t, s) => t + s.amount, 0);
}

/** balance = openingBalance - sum(spent) */
export function calcBalance(openingBalance: number, spent: Spent[]): number {
  return openingBalance - sumSpent(spent);
}

/** committedAhead = sum(commitments due on or after currentDay, within the 30-day window) */
export function calcCommittedAhead(
  commitments: Commitment[],
  currentDay: number,
  totalDays: number,
): number {
  return commitments
    .filter((c) => c.day >= currentDay && c.day <= totalDays)
    .reduce((t, c) => t + c.amount, 0);
}

/** daysLeft = totalDays - currentDay + 1 */
export function calcDaysLeft(totalDays: number, currentDay: number): number {
  return Math.max(0, totalDays - currentDay + 1);
}

/** spendable = max(0, balance - committedAhead - bufferTarget) */
export function calcSpendable(
  balance: number,
  committedAhead: number,
  bufferTarget: number,
): number {
  return Math.max(0, balance - committedAhead - bufferTarget);
}

/** safeToSpendToday = floor(spendable / daysLeft) */
export function calcSafeToSpend(spendable: number, daysLeft: number): number {
  if (daysLeft <= 0) return 0;
  return Math.floor(spendable / daysLeft);
}

/** goalPace = (goal.target - goal.saved) / max(1, goal.deadlineDay - currentDay + 1) */
export function calcGoalPace(goal: Goal, currentDay: number): number {
  const days = Math.max(1, goal.deadlineDay - currentDay + 1);
  return (goal.target - goal.saved) / days;
}

/** avgDailySpend = average of past spending across the days elapsed (currentDay - 1). */
export function calcAvgDailySpend(spent: Spent[], currentDay: number): number {
  const elapsed = Math.max(0, currentDay - 1);
  if (elapsed <= 0) return 0;
  return sumSpent(spent) / elapsed;
}

/** forecastEndBalance = balance - committedAhead - avgDailySpend * daysLeft */
export function calcForecastEnd(
  balance: number,
  committedAhead: number,
  avgDailySpend: number,
  daysLeft: number,
): number {
  return balance - committedAhead - avgDailySpend * daysLeft;
}

export interface HealthParts {
  liquidity: number;
  commitment: number;
  goal: number;
  steadiness: number;
  overall: number;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Decomposable 0-100 health signal (neutral, not a grade).
 * 1. Liquidity: balance relative to 2x buffer (100 once comfortably above).
 * 2. Commitment ratio: 1 - committedAhead/balance (lower commitments score higher).
 * 3. Goal progress: saved/target measured against time elapsed.
 * 4. Steadiness: inverse of day-to-day spending variation (active days only).
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

  // Steadiness: coefficient of variation across days that have spending.
  const byDay = new Map<number, number>();
  for (const s of spent) byDay.set(s.day, (byDay.get(s.day) ?? 0) + s.amount);
  const active = [...byDay.values()].filter((v) => v > 0);
  let steadiness: number;
  if (active.length < 2) {
    steadiness = 80; // neutral when there is nothing to compare yet
  } else {
    const mean = active.reduce((a, b) => a + b, 0) / active.length;
    if (mean <= 0) steadiness = 80;
    else {
      const variance =
        active.reduce((a, b) => a + (b - mean) * (b - mean), 0) / active.length;
      const cv = Math.sqrt(variance) / mean;
      steadiness = Math.round(clamp01(1 - cv / 2) * 100);
    }
  }

  const overall = Math.round((liquidity + commitment + goalScore + steadiness) / 4);
  return { liquidity, commitment, goal: goalScore, steadiness, overall };
}

/**
 * Projected day the goal completes if the user can set aside up to
 * `safePerDay` each day starting today. Assumption documented in README.
 */
export function calcGoalFinishDay(
  goal: Goal,
  currentDay: number,
  safePerDay: number,
): number {
  const remaining = Math.max(0, goal.target - goal.saved);
  if (remaining <= 0) return currentDay;
  const perDay = Math.max(1, Math.floor(safePerDay));
  const daysNeeded = Math.ceil(remaining / perDay);
  return currentDay + daysNeeded - 1;
}

export function formatINR(n: number): string {
  const rounded = Math.round(n);
  return "₹" + rounded.toLocaleString("en-IN");
}
