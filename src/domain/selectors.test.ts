import { describe, expect, it } from "vitest";
import { createInitialState, contextOf, scenarioOf } from "../state/scenario";
import { selectDerived, selectPreview } from "./selectors";

describe("selectors", () => {
  it("derives the seed's known numbers", () => {
    const d = selectDerived(createInitialState(), scenarioOf());
    expect(d.balance).toBe(8830);
    expect(d.committedAhead).toBe(717);
    expect(d.daysLeft).toBe(19);
    expect(d.spendable).toBe(7513);
    expect(d.safe).toBe(395);
    expect(d.risk.level).toBe("low");
  });

  it("returns null preview without a draft", () => {
    expect(selectPreview(createInitialState(), null, scenarioOf(), contextOf())).toBeNull();
  });

  it("preview matches applying the same decision", () => {
    const state = createInitialState();
    const draft = { kind: "purchase", label: "Headphones", amount: 1499, day: 12 } as const;
    const preview = selectPreview(state, draft, scenarioOf(), contextOf());
    expect(preview).not.toBeNull();
    expect(preview?.balance).toBe(7331);
    expect(preview?.safe).toBe(316);
    // Committed state is untouched by the preview.
    expect(selectDerived(state, scenarioOf()).balance).toBe(8830);
  });

  it("a cancelling preview frees the bill without moving the balance", () => {
    const preview = selectPreview(
      createInitialState(),
      { kind: "cancel-subscription", commitmentId: "c3" },
      scenarioOf(),
      contextOf(),
    );
    expect(preview?.balance).toBe(8830);
    expect(preview?.committedAhead).toBe(717 - 199);
  });
});
