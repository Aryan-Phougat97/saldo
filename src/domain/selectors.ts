import {
  calcAvgDailySpend,
  calcBalance,
  calcCommittedAhead,
  calcDaysLeft,
  calcForecastEnd,
  calcGoalFinishDay,
  calcGoalPace,
  calcSafeToSpend,
  calcSpendable,
} from "./formulas";
import { calcHealth } from "./health";
import { classifyRisk } from "./risk";
import { applyDecision, type ApplyContext } from "./simulate";
import type { BudgetState, Decision, Derived } from "./types";

export interface Scenario {
  currentDay: number;
  totalDays: number;
  openingBalance: number;
  bufferTarget: number;
}

/**
 * Read all display numbers for a state through one selector.
 * Components must use this instead of recombining formulas by hand.
 */
export function selectDerived(state: BudgetState, scenario: Scenario): Derived {
  const { currentDay, totalDays, openingBalance, bufferTarget } = scenario;
  const goal = state.goals[0];
  const balance = calcBalance(openingBalance, state.spent);
  const committedAhead = calcCommittedAhead(state.commitments, currentDay, totalDays);
  const daysLeft = calcDaysLeft(totalDays, currentDay);
  const spendable = calcSpendable(balance, committedAhead, bufferTarget);
  const safe = calcSafeToSpend(spendable, daysLeft);
  const avg = calcAvgDailySpend(state.spent, currentDay);
  const forecast = calcForecastEnd(balance, committedAhead, avg, daysLeft);
  const goalPace = calcGoalPace(goal, currentDay);
  const goalFinish = calcGoalFinishDay(goal, currentDay, safe);
  const health = calcHealth(
    balance,
    committedAhead,
    bufferTarget,
    goal,
    state.spent,
    currentDay,
    totalDays,
  );
  const risk = classifyRisk({
    spendable,
    safe,
    avg,
    forecast,
    bufferTarget,
    goalFinish,
    deadlineDay: goal.deadlineDay,
  });
  return {
    balance,
    committedAhead,
    daysLeft,
    spendable,
    safe,
    avg,
    forecast,
    goalPace,
    goalFinish,
    health,
    risk,
  };
}

/**
 * Preview a decision without touching committed state: run it through the
 * same pure engine, then derive numbers from the hypothetical outcome.
 * Returns null when there is no draft.
 */
export function selectPreview(
  state: BudgetState,
  draft: Decision | null,
  scenario: Scenario,
  ctx: ApplyContext,
): Derived | null {
  if (!draft) return null;
  const { state: next, ok } = applyDecision(state, draft, ctx);
  if (!ok) return null;
  return selectDerived(next, scenario);
}
