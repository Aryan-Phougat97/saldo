import type { Commitment, Goal, Income, Spent } from "./types";

/**
 * Opening balance from its visible parts: starting cash plus income received
 * on or before today. The balance formula itself is unchanged — this only
 * explains where the opening number comes from.
 * Formula: opening = openingBase + sum(income with day <= currentDay).
 */
export function calcOpening(
  openingBase: number,
  income: Income[],
  currentDay: number,
): number {
  return (
    openingBase +
    income.filter((i) => i.day <= currentDay).reduce((total, i) => total + i.amount, 0)
  );
}

/**
 * Total spent so far.
 * Formula: sum of every spent amount.
 */
export function sumSpent(spent: Spent[]): number {
  return spent.reduce((total, s) => total + s.amount, 0);
}

/**
 * Cash in hand right now.
 * Formula: balance = openingBalance − sum(spent).
 */
export function calcBalance(openingBalance: number, spent: Spent[]): number {
  return openingBalance - sumSpent(spent);
}

/**
 * Money already spoken for by upcoming bills.
 * Formula: committedAhead = sum of commitments due on or after
 * currentDay and on or before totalDays.
 */
export function calcCommittedAhead(
  commitments: Commitment[],
  currentDay: number,
  totalDays: number,
): number {
  return commitments
    .filter((c) => c.day >= currentDay && c.day <= totalDays)
    .reduce((total, c) => total + c.amount, 0);
}

/**
 * Days remaining including today.
 * Formula: daysLeft = totalDays − currentDay + 1 (never negative).
 */
export function calcDaysLeft(totalDays: number, currentDay: number): number {
  return Math.max(0, totalDays - currentDay + 1);
}

/**
 * Money free to spend or save after bills and buffer are protected.
 * Formula: spendable = max(0, balance − committedAhead − bufferTarget).
 */
export function calcSpendable(
  balance: number,
  committedAhead: number,
  bufferTarget: number,
): number {
  return Math.max(0, balance - committedAhead - bufferTarget);
}

/**
 * The hero number: today's fair share of what's spendable.
 * Formula: safeToSpendToday = floor(spendable / daysLeft), 0 when no days left.
 */
export function calcSafeToSpend(spendable: number, daysLeft: number): number {
  if (daysLeft <= 0) return 0;
  return Math.floor(spendable / daysLeft);
}

/**
 * Daily saving pace needed to hit a goal exactly on its deadline.
 * Formula: goalPace = (target − saved) / max(1, deadlineDay − currentDay + 1).
 */
export function calcGoalPace(goal: Goal, currentDay: number): number {
  const days = Math.max(1, goal.deadlineDay - currentDay + 1);
  return (goal.target - goal.saved) / days;
}

/**
 * Typical daily burn so far.
 * Formula: avgDailySpend = sum(spent) / max(0, currentDay − 1).
 * Day 1 has no history, so the average is 0.
 */
export function calcAvgDailySpend(spent: Spent[], currentDay: number): number {
  const elapsed = Math.max(0, currentDay - 1);
  if (elapsed <= 0) return 0;
  return sumSpent(spent) / elapsed;
}

/**
 * Where the month lands if the current pace holds.
 * Formula: forecastEnd = balance − committedAhead − avgDailySpend × daysLeft.
 */
export function calcForecastEnd(
  balance: number,
  committedAhead: number,
  avgDailySpend: number,
  daysLeft: number,
): number {
  return balance - committedAhead - avgDailySpend * daysLeft;
}

/**
 * Projected day a goal completes if up to `safePerDay` can be set aside daily.
 * A finished goal returns today; a zero pace still creeps at ₹1/day so the
 * date stays finite and honest instead of infinite.
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
