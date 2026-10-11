import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/store";
import { applyDecision, type ApplyContext } from "./simulate";
import type { BudgetState } from "./types";

const CTX: ApplyContext = {
  currentDay: 12,
  totalDays: 30,
  shocks: [
    { id: "h1", label: "Phone screen repair", amount: 2200, day: 12, note: "" },
  ],
};

function frozen(): BudgetState {
  const s = createInitialState();
  return {
    spent: Object.freeze([...s.spent]) as BudgetState["spent"],
    commitments: Object.freeze([...s.commitments]) as BudgetState["commitments"],
    cancelled: [],
    goals: s.goals.map((g) => Object.freeze({ ...g })) as BudgetState["goals"],
    usedShocks: [],
    log: [],
  };
}

describe("applyDecision", () => {
  it("adds a purchase to spent and logs it", () => {
    const { state, ok } = applyDecision(createInitialState(), {
      kind: "purchase",
      label: "Headphones",
      amount: 1499,
      day: 12,
    }, CTX);
    expect(ok).toBe(true);
    expect(state.spent).toHaveLength(4);
    expect(state.log).toHaveLength(1);
    expect(state.log[0].label).toBe("Headphones");
    expect(state.log[0].amount).toBe(1499);
  });

  it("handles a purchase larger than the balance without crashing", () => {
    const { state, ok } = applyDecision(createInitialState(), {
      kind: "purchase",
      label: "Everything",
      amount: 99999,
      day: 12,
    }, CTX);
    expect(ok).toBe(true);
    expect(state.spent).toHaveLength(4);
  });

  it("adds a subscription as a monthly commitment", () => {
    const { state, ok } = applyDecision(createInitialState(), {
      kind: "subscribe",
      label: "Gym",
      amount: 800,
      day: 20,
    }, CTX);
    expect(ok).toBe(true);
    const added = state.commitments[state.commitments.length - 1];
    expect(added.recurring).toBe("monthly");
    expect(added.day).toBe(20);
  });

  it("cancels a subscription into the cancelled list and logs the saving", () => {
    const before = createInitialState();
    const { state, ok } = applyDecision(
      before,
      { kind: "cancel-subscription", commitmentId: "c1" },
      CTX,
    );
    expect(ok).toBe(true);
    expect(state.commitments.find((c) => c.id === "c1")).toBeUndefined();
    expect(state.cancelled).toHaveLength(1);
    expect(state.cancelled[0].label).toBe("Spotify");
    expect(state.log[0].amount).toBe(119);
  });

  it("refuses to cancel the same subscription twice", () => {
    const first = applyDecision(createInitialState(), {
      kind: "cancel-subscription",
      commitmentId: "c1",
    }, CTX);
    const second = applyDecision(first.state, {
      kind: "cancel-subscription",
      commitmentId: "c1",
    }, CTX);
    expect(second.ok).toBe(false);
    expect(second.state.log).toHaveLength(1);
  });

  it("pays a shock in full with pay-now", () => {
    const { state, ok } = applyDecision(createInitialState(), {
      kind: "shock",
      shockId: "h1",
      response: "pay-now",
    }, CTX);
    expect(ok).toBe(true);
    expect(state.spent).toHaveLength(4);
    expect(state.commitments).toHaveLength(3);
    expect(state.usedShocks).toEqual(["h1"]);
  });

  it("splits a shock across today and a bill in 7 days", () => {
    const { state, ok } = applyDecision(createInitialState(), {
      kind: "shock",
      shockId: "h1",
      response: "split",
    }, CTX);
    expect(ok).toBe(true);
    const part2 = state.commitments[state.commitments.length - 1];
    expect(part2.day).toBe(19);
    expect(part2.amount).toBe(1100);
  });

  it("defers a shock entirely and rejects answering twice", () => {
    const first = applyDecision(createInitialState(), {
      kind: "shock",
      shockId: "h1",
      response: "defer",
    }, CTX);
    expect(first.ok).toBe(true);
    expect(first.state.spent).toHaveLength(3);
    expect(first.state.commitments).toHaveLength(4);
    const second = applyDecision(first.state, {
      kind: "shock",
      shockId: "h1",
      response: "pay-now",
    }, CTX);
    expect(second.ok).toBe(false);
  });

  it("moves cash into a goal and drops the balance by the same amount", () => {
    const before = createInitialState();
    const { state, ok } = applyDecision(before, {
      kind: "transfer-goal",
      goalId: "g1",
      amount: 500,
    }, CTX);
    expect(ok).toBe(true);
    expect(state.goals[0].saved).toBe(1700);
    expect(state.spent).toHaveLength(4);
  });

  it("rejects a transfer to a missing goal", () => {
    const { ok } = applyDecision(createInitialState(), {
      kind: "transfer-goal",
      goalId: "nope",
      amount: 500,
    }, CTX);
    expect(ok).toBe(false);
  });

  it("never mutates its inputs", () => {
    const state = frozen();
    applyDecision(state, { kind: "purchase", label: "X", amount: 10, day: 12 }, CTX);
    applyDecision(state, { kind: "transfer-goal", goalId: "g1", amount: 10 }, CTX);
    expect(state.spent).toHaveLength(3);
    expect(state.goals[0].saved).toBe(1200);
    expect(state.log).toHaveLength(0);
  });
});
