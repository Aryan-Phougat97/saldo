/** Shared domain types for the Saldo budget model. No React imports here. */

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

export interface Income {
  id: string;
  label: string;
  amount: number;
  day: number;
}

/** An unexpected expense the user must respond to (paid, split, or deferred). */
export interface ShockEvent {
  id: string;
  label: string;
  amount: number;
  day: number;
  note: string;
}

/** Every decision a user can preview and then apply or discard. */
export type Decision =
  | { kind: "purchase"; label: string; amount: number; day: number }
  | { kind: "subscribe"; label: string; amount: number; day: number }
  | { kind: "cancel-subscription"; commitmentId: string }
  | { kind: "shock"; shockId: string; response: "pay-now" | "split" | "defer" }
  | { kind: "transfer-goal"; goalId: string; amount: number };

/** A committed record of one applied decision, shown in the decision log. */
export interface DecisionEntry {
  id: string;
  day: number;
  label: string;
  amount: number;
  kind: Decision["kind"];
}

/** Committed (applied) budget state. Drafts live outside this, in the store. */
export interface BudgetState {
  spent: Spent[];
  commitments: Commitment[];
  cancelled: Commitment[];
  goals: Goal[];
  usedShocks: string[];
  log: DecisionEntry[];
}

/** All numbers derived from a BudgetState for one render. */
export interface Derived {
  balance: number;
  committedAhead: number;
  daysLeft: number;
  spendable: number;
  safe: number;
  avg: number;
  forecast: number;
  goalPace: number;
  goalFinish: number;
  health: HealthParts;
  risk: RiskAssessment;
}

export interface HealthParts {
  liquidity: number;
  commitment: number;
  goal: number;
  steadiness: number;
  overall: number;
}

export type RiskLevel = "low" | "medium" | "high";

export interface RiskAssessment {
  level: RiskLevel;
  reason: string;
}
