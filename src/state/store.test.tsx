// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBudgetStore } from "./store";

// Lets React flush hook updates without act() warnings under vitest.
(globalThis as unknown as Record<string, boolean>).IS_REACT_ACT_ENVIRONMENT = true;

const PURCHASE = { kind: "purchase", label: "Headphones", amount: 1499, day: 12 } as const;

describe("useBudgetStore flows", () => {
  it("starts from the seed with no history", () => {
    const { result } = renderHook(() => useBudgetStore());
    expect(result.current.real.balance).toBe(8830);
    expect(result.current.log).toHaveLength(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.preview).toBeNull();
  });

  it("previews without touching committed state", () => {
    const { result } = renderHook(() => useBudgetStore());
    act(() => result.current.simulate({ ...PURCHASE }));
    expect(result.current.preview?.balance).toBe(7331);
    expect(result.current.real.balance).toBe(8830);
    expect(result.current.log).toHaveLength(0);
  });

  it("applies, logs, announces, and becomes undoable", () => {
    const { result } = renderHook(() => useBudgetStore());
    act(() => result.current.simulate({ ...PURCHASE }));
    act(() => result.current.apply());
    expect(result.current.real.balance).toBe(7331);
    expect(result.current.log).toHaveLength(1);
    expect(result.current.log[0].label).toBe("Headphones");
    expect(result.current.preview).toBeNull();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.announcement).toMatch(/Applied Headphones/);
  });

  it("discards cleanly with no trace", () => {
    const { result } = renderHook(() => useBudgetStore());
    act(() => result.current.simulate({ ...PURCHASE }));
    act(() => result.current.discard());
    expect(result.current.preview).toBeNull();
    expect(result.current.real.balance).toBe(8830);
    expect(result.current.log).toHaveLength(0);
    expect(result.current.announcement).toMatch(/discarded/);
  });

  it("undoes the last apply and restores every number", () => {
    const { result } = renderHook(() => useBudgetStore());
    act(() => result.current.simulate({ ...PURCHASE }));
    act(() => result.current.apply());
    act(() => result.current.undo());
    expect(result.current.real.balance).toBe(8830);
    expect(result.current.real.safe).toBe(395);
    expect(result.current.log).toHaveLength(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.announcement).toMatch(/Undid Headphones/);
  });

  it("undoes stacked applies one layer at a time", () => {
    const { result } = renderHook(() => useBudgetStore());
    act(() => result.current.simulate({ ...PURCHASE }));
    act(() => result.current.apply());
    act(() => result.current.simulate({ kind: "subscribe", label: "Gym", amount: 800, day: 20 }));
    act(() => result.current.apply());
    expect(result.current.log).toHaveLength(2);
    act(() => result.current.undo());
    expect(result.current.log).toHaveLength(1);
    expect(result.current.real.committedAhead).toBe(717);
    act(() => result.current.undo());
    expect(result.current.log).toHaveLength(0);
    expect(result.current.real.balance).toBe(8830);
  });

  it("ignores undo with empty history", () => {
    const { result } = renderHook(() => useBudgetStore());
    act(() => result.current.undo());
    expect(result.current.real.balance).toBe(8830);
    expect(result.current.announcement).toBe("");
  });

  it("resets to a fresh month including history", () => {
    const { result } = renderHook(() => useBudgetStore());
    act(() => result.current.simulate({ ...PURCHASE }));
    act(() => result.current.apply());
    act(() => result.current.resetScenario());
    expect(result.current.real.balance).toBe(8830);
    expect(result.current.log).toHaveLength(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.announcement).toMatch(/reset/);
  });
});
