import type {
  BudgetState,
  Decision,
  DecisionEntry,
  Goal,
  ShockEvent,
} from "./types";

export interface ApplyContext {
  currentDay: number;
  totalDays: number;
  shocks: ShockEvent[];
}

export interface ApplyResult {
  state: BudgetState;
  /** False when the decision targeted something already gone (e.g. double-cancel). */
  ok: boolean;
}

function clampDay(day: number, totalDays: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.max(1, Math.min(totalDays, Math.round(day)));
}

function nextId(prefix: string, state: BudgetState): string {
  return `${prefix}-${state.log.length + 1}`;
}

function withEntry(state: BudgetState, entry: Omit<DecisionEntry, "id">): DecisionEntry {
  return { ...entry, id: nextId("d", state) };
}

/**
 * Pure simulation engine: apply one user decision to committed state.
 *
 * Never mutates its inputs — always returns a fresh BudgetState with a log
 * entry appended. Unknown or already-consumed targets (cancelled twice, shock
 * answered twice, missing goal) leave the state untouched with `ok: false`,
 * so the UI can explain instead of corrupting numbers.
 *
 * - purchase: adds a Spent line (day clamped into the month).
 * - subscribe: adds a monthly Commitment, due no earlier than today.
 * - cancel-subscription: removes the commitment into `cancelled` (used for the
 *   30-day/annual savings maths); the money stays in the balance.
 * - shock pay-now: full amount into Spent. split: half now, half as a bill due
 *   in 7 days. defer: full amount as a bill due in 7 days.
 * - transfer-goal: moves cash into `goal.saved` and records the same amount as
 *   Spent ("Moved to …") so the balance drops truthfully.
 */
export function applyDecision(
  state: BudgetState,
  decision: Decision,
  ctx: ApplyContext,
): ApplyResult {
  const day = ctx.currentDay;

  switch (decision.kind) {
    case "purchase": {
      const amount = Math.max(0, Math.round(decision.amount));
      const entry = withEntry(state, {
        day,
        label: decision.label,
        amount,
        kind: "purchase",
      });
      return {
        ok: true,
        state: {
          ...state,
          spent: [
            ...state.spent,
            { id: nextId("s", state), label: decision.label, amount, day: clampDay(decision.day, ctx.totalDays) },
          ],
          log: [...state.log, entry],
        },
      };
    }

    case "subscribe": {
      const amount = Math.max(0, Math.round(decision.amount));
      const entry = withEntry(state, {
        day,
        label: `Subscribed: ${decision.label}`,
        amount,
        kind: "subscribe",
      });
      return {
        ok: true,
        state: {
          ...state,
          commitments: [
            ...state.commitments,
            {
              id: nextId("c", state),
              label: decision.label,
              amount,
              day: Math.max(day, clampDay(decision.day, ctx.totalDays)),
              recurring: "monthly",
            },
          ],
          log: [...state.log, entry],
        },
      };
    }

    case "cancel-subscription": {
      const target = state.commitments.find((c) => c.id === decision.commitmentId);
      if (!target) return { state, ok: false };
      const entry = withEntry(state, {
        day,
        label: `Cancelled ${target.label}`,
        amount: target.amount,
        kind: "cancel-subscription",
      });
      return {
        ok: true,
        state: {
          ...state,
          commitments: state.commitments.filter((c) => c.id !== target.id),
          cancelled: [...state.cancelled, target],
          log: [...state.log, entry],
        },
      };
    }

    case "shock": {
      const shock = ctx.shocks.find((s) => s.id === decision.shockId);
      if (!shock || state.usedShocks.includes(shock.id)) return { state, ok: false };
      const due = Math.min(ctx.totalDays, day + 7);
      const half = Math.round(shock.amount / 2);
      const spentAdd =
        decision.response === "defer"
          ? []
          : [
              {
                id: nextId("s", state),
                label: shock.label,
                amount: decision.response === "split" ? half : shock.amount,
                day,
              },
            ];
      const commitAdd =
        decision.response === "pay-now"
          ? []
          : [
              {
                id: nextId("c", state),
                label: `${shock.label} (part 2)`,
                amount: decision.response === "split" ? shock.amount - half : shock.amount,
                day: due,
              },
            ];
      const entry = withEntry(state, {
        day,
        label: `${shock.label} — ${decision.response === "pay-now" ? "paid now" : decision.response === "split" ? "split over 7 days" : "deferred 7 days"}`,
        amount: shock.amount,
        kind: "shock",
      });
      return {
        ok: true,
        state: {
          ...state,
          spent: [...state.spent, ...spentAdd],
          commitments: [...state.commitments, ...commitAdd],
          usedShocks: [...state.usedShocks, shock.id],
          log: [...state.log, entry],
        },
      };
    }

    case "transfer-goal": {
      const goal: Goal | undefined = state.goals.find((g) => g.id === decision.goalId);
      if (!goal) return { state, ok: false };
      const amount = Math.max(0, Math.round(decision.amount));
      const entry = withEntry(state, {
        day,
        label: `Moved ${amount} to ${goal.label}`,
        amount,
        kind: "transfer-goal",
      });
      return {
        ok: true,
        state: {
          ...state,
          spent: [
            ...state.spent,
            { id: nextId("s", state), label: `Moved to ${goal.label}`, amount, day },
          ],
          goals: state.goals.map((g) =>
            g.id === goal.id ? { ...g, saved: g.saved + amount } : g,
          ),
          log: [...state.log, entry],
        },
      };
    }
  }
}
