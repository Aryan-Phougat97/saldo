import { seed } from "../data/seed";
import type { BudgetState } from "../domain/types";
import type { ApplyContext } from "../domain/simulate";

export interface Scenario {
  currentDay: number;
  totalDays: number;
  openingBalance: number;
  bufferTarget: number;
}

/** Fixed month parameters every derivation reads. */
export function scenarioOf(): Scenario {
  return {
    currentDay: seed.currentDay,
    totalDays: seed.totalDays,
    openingBalance: seed.openingBalance,
    bufferTarget: seed.bufferTarget,
  };
}

/** Context the pure engine needs (clock + shock catalogue). */
export function contextOf(): ApplyContext {
  return { currentDay: seed.currentDay, totalDays: seed.totalDays, shocks: seed.shocks };
}

/** Fresh committed state copied from the seed (never the seed arrays themselves). */
export function createInitialState(): BudgetState {
  return {
    spent: seed.spent.map((s) => ({ ...s })),
    commitments: seed.commitments.map((c) => ({ ...c })),
    cancelled: [],
    goals: seed.goals.map((g) => ({ ...g })),
    usedShocks: [],
    log: [],
  };
}
