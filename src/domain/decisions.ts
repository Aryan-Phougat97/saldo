import { formatINR } from "../lib/format";
import type { ShockEvent, ShockResponse } from "./types";

/** Upper bound for any simulated amount — the demo covers one small month. */
export const MAX_SIM_AMOUNT = 100000;

export type AmountResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Parse and validate a user-typed amount. One rule set for every panel, so
 * the simulator and the goal transfer can never disagree about what's valid.
 * Empty, non-numeric, and non-positive input share one message; anything
 * above MAX_SIM_AMOUNT gets the cap message.
 */
export function parseAmount(input: string, max: number = MAX_SIM_AMOUNT): AmountResult {
  const n = Number(input);
  if (input.trim() === "" || !Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "Enter an amount above ₹0." };
  }
  if (n > max) {
    return {
      ok: false,
      error: `Keep it under ${formatINR(max)} — this demo covers one small month.`,
    };
  }
  return { ok: true, value: Math.round(n) };
}

/**
 * What cancelling a monthly subscription keeps.
 * `monthly` lands back in this month; `annual` is what a full year would
 * have cost at the same price.
 */
export function cancellationImpact(monthlyAmount: number): { monthly: number; annual: number } {
  const monthly = Math.max(0, Math.round(monthlyAmount));
  return { monthly, annual: monthly * 12 };
}

/**
 * Plain-language consequence of each shock answer, shown before applying.
 * Split halves round down today with the remainder due in 7 days — the same
 * split the engine applies, stated up front.
 */
export function describeShockResponse(shock: ShockEvent, response: ShockResponse): string {
  switch (response) {
    case "pay-now":
      return `Full ${formatINR(shock.amount)} leaves the balance today.`;
    case "split": {
      const today = Math.round(shock.amount / 2);
      return `${formatINR(today)} leaves today, the rest becomes a bill due in 7 days.`;
    }
    case "defer":
      return `Nothing leaves today; the full ${formatINR(shock.amount)} becomes a bill due in 7 days.`;
  }
}
