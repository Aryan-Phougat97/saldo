import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { formatINR } from "../lib/format";
import { seed } from "../data/seed";
import { selectDerived, selectPreview } from "../domain/selectors";
import { applyDecision } from "../domain/simulate";
import type { BudgetState, Decision, Derived } from "../domain/types";
import { contextOf, createInitialState, scenarioOf } from "./scenario";

interface StoreShape extends BudgetState {
  draft: Decision | null;
  /** Committed snapshots before each apply, newest last (capped). Powers undo. */
  past: BudgetState[];
}

/** The committed slice of a store, without draft or history. */
function snapshot(s: StoreShape): BudgetState {
  return {
    spent: s.spent,
    commitments: s.commitments,
    cancelled: s.cancelled,
    goals: s.goals,
    usedShocks: s.usedShocks,
    log: s.log,
  };
}

const HISTORY_LIMIT = 30;

type Action =
  | { type: "SET_DRAFT"; decision: Decision }
  | { type: "CLEAR_DRAFT" }
  | { type: "APPLY_DRAFT" }
  | { type: "UNDO" }
  | { type: "RESET" };

function reducer(state: StoreShape, action: Action): StoreShape {
  switch (action.type) {
    case "SET_DRAFT":
      return { ...state, draft: action.decision };
    case "CLEAR_DRAFT":
      return { ...state, draft: null };
    case "APPLY_DRAFT": {
      if (!state.draft) return state;
      const { state: next, ok } = applyDecision(state, state.draft, contextOf());
      if (!ok) return { ...state, draft: null };
      return { ...next, draft: null, past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT) };
    }
    case "UNDO": {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      return { ...prev, draft: null, past: state.past.slice(0, -1) };
    }
    case "RESET":
      return { ...createInitialState(), draft: null, past: [] };
  }
}

function useReducedMotion(): boolean {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );
  return reduced;
}

/**
 * Single owner of budget state. Committed numbers live in the reducer;
 * a simulation is a temporary draft layered on top, derived through the same
 * pure engine — so preview and apply can never disagree.
 */
export function useBudgetStore() {
  const [store, dispatch] = useReducer(reducer, undefined, () => ({
    ...createInitialState(),
    draft: null,
    past: [],
  }));
  const [hotStage, setHotStage] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const timers = useRef<number[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) window.clearTimeout(t);
      pending.length = 0;
    };
  }, []);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
    setHotStage(0);
  }, []);

  const scenario = useMemo(() => scenarioOf(), []);
  const ctx = useMemo(() => contextOf(), []);

  const real: Derived = useMemo(
    () => selectDerived(store, scenario),
    [store, scenario],
  );

  const preview: Derived | null = useMemo(
    () => selectPreview(store, store.draft, scenario, ctx),
    [store, scenario, ctx],
  );

  const shown = preview ?? real;

  const simulate = useCallback(
    (decision: Decision) => {
      clearTimers();
      setAnnouncement("");
      const normalized: Decision =
        decision.kind === "purchase" || decision.kind === "subscribe"
          ? { ...decision, amount: Math.max(0, Math.round(decision.amount)) }
          : decision.kind === "transfer-goal"
            ? { ...decision, amount: Math.max(0, Math.round(decision.amount)) }
            : decision;
      dispatch({ type: "SET_DRAFT", decision: normalized });
    },
    [clearTimers],
  );

  const discard = useCallback(() => {
    clearTimers();
    dispatch({ type: "CLEAR_DRAFT" });
    setAnnouncement("Simulation discarded. Nothing changed.");
  }, [clearTimers]);

  const apply = useCallback(() => {
    if (!store.draft) return;
    // Announce from the same pure engine the reducer commits, so the message
    // can never describe numbers the state doesn't land on.
    const { state: next, ok } = applyDecision(store, store.draft, ctx);
    if (!ok) {
      dispatch({ type: "CLEAR_DRAFT" });
      setAnnouncement("That decision no longer applies. Nothing changed.");
      return;
    }
    const after = selectDerived(next, scenario);
    const label =
      store.draft.kind === "purchase" || store.draft.kind === "subscribe"
        ? store.draft.label
        : store.draft.kind === "cancel-subscription"
          ? "Cancellation"
          : store.draft.kind === "shock"
            ? "Shock response"
            : "Goal transfer";
    const amount =
      store.draft.kind === "purchase" ||
      store.draft.kind === "subscribe" ||
      store.draft.kind === "transfer-goal"
        ? store.draft.amount
        : 0;
    dispatch({ type: "APPLY_DRAFT" });
    setAnnouncement(
      amount > 0
        ? `Applied ${label} for ${formatINR(amount)}. Balance now ${formatINR(after.balance)}.`
        : `Applied ${label}. Balance now ${formatINR(after.balance)}.`,
    );
    if (reducedMotion) {
      setHotStage(0);
    } else {
      // Ordered stagger: 1 balance → 2 safe → 3 goal → 4 forecast → 5 health.
      // Transform/opacity only — no layout properties are animated.
      clearTimers();
      setHotStage(1);
      for (const stage of [2, 3, 4, 5]) {
        timers.current.push(
          window.setTimeout(() => setHotStage(stage), 300 * (stage - 1)),
        );
      }
      timers.current.push(window.setTimeout(() => setHotStage(0), 300 * 5 + 1200));
    }
  }, [store, ctx, scenario, reducedMotion, clearTimers]);

  const resetScenario = useCallback(() => {
    clearTimers();
    dispatch({ type: "RESET" });
    setAnnouncement("Scenario reset. Back to day 12 with a fresh month.");
  }, [clearTimers]);

  const canUndo = store.past.length > 0;

  const undo = useCallback(() => {
    const prev = store.past[store.past.length - 1];
    if (!prev) return;
    const lastEntry = store.log[store.log.length - 1];
    clearTimers();
    dispatch({ type: "UNDO" });
    const after = selectDerived(prev, scenario);
    setAnnouncement(
      lastEntry
        ? `Undid ${lastEntry.label}. Balance back to ${formatINR(after.balance)}.`
        : "Undid the last decision.",
    );
  }, [store, scenario, clearTimers]);

  const goal = store.goals[0];

  return {
    spent: store.spent,
    commitments: store.commitments,
    cancelled: store.cancelled,
    goals: store.goals,
    log: store.log,
    usedShocks: store.usedShocks,
    simulation: store.draft,
    simulate,
    discard,
    apply,
    undo,
    canUndo,
    resetScenario,
    real,
    preview,
    shown,
    hotStage,
    announcement,
    goal,
    currentDay: seed.currentDay,
    totalDays: seed.totalDays,
    openingBalance: seed.openingBalance,
    openingBase: seed.openingBase,
    income: seed.income,
    shocks: seed.shocks,
    bufferTarget: seed.bufferTarget,
    reducedMotion,
  };
}

/** The full store object passed to demo components. */
export type Budget = ReturnType<typeof useBudgetStore>;
