import { useCallback, useMemo, useState } from "react";
import {
  calcAvgDailySpend,
  calcBalance,
  calcCommittedAhead,
  calcDaysLeft,
  calcForecastEnd,
  calcGoalFinishDay,
  calcGoalPace,
  calcHealth,
  calcSafeToSpend,
  calcSpendable,
  formatINR,
  type Commitment,
  type Goal,
  type Simulation,
  type Spent,
} from "../lib/finance";
import { seed } from "../state/seed";

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
  health: ReturnType<typeof calcHealth>;
}

function derive(
  spent: Spent[],
  commitments: Commitment[],
  goal: Goal,
  bufferTarget: number,
  currentDay: number,
  totalDays: number,
  openingBalance: number,
): Derived {
  const balance = calcBalance(openingBalance, spent);
  const committedAhead = calcCommittedAhead(commitments, currentDay, totalDays);
  const daysLeft = calcDaysLeft(totalDays, currentDay);
  const spendable = calcSpendable(balance, committedAhead, bufferTarget);
  const safe = calcSafeToSpend(spendable, daysLeft);
  const avg = calcAvgDailySpend(spent, currentDay);
  const forecast = calcForecastEnd(balance, committedAhead, avg, daysLeft);
  const goalPace = calcGoalPace(goal, currentDay);
  const goalFinish = calcGoalFinishDay(goal, currentDay, safe);
  const health = calcHealth(balance, committedAhead, bufferTarget, goal, spent, currentDay, totalDays);
  return { balance, committedAhead, daysLeft, spendable, safe, avg, forecast, goalPace, goalFinish, health };
}

export function useReducedMotion(): boolean {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );
  return reduced;
}

let simId = 0;

export function useBudget() {
  const [spent, setSpent] = useState<Spent[]>(seed.spent);
  const [commitments, setCommitments] = useState<Commitment[]>(seed.commitments);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [hotStage, setHotStage] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const reducedMotion = useReducedMotion();

  const goal = seed.goals[0];
  const { currentDay, totalDays, openingBalance, bufferTarget } = seed;

  const real = useMemo(
    () => derive(spent, commitments, goal, bufferTarget, currentDay, totalDays, openingBalance),
    [spent, commitments, goal, bufferTarget, currentDay, totalDays, openingBalance],
  );

  const preview = useMemo<Derived | null>(() => {
    if (!simulation) return null;
    const simSpent: Spent[] = simulation.recurring
      ? spent
      : [...spent, { id: "sim", label: simulation.label, amount: simulation.amount, day: simulation.day }];
    const simCommitments: Commitment[] = simulation.recurring
      ? [...commitments, { id: "sim", label: simulation.label, amount: simulation.amount, day: simulation.day, recurring: "monthly" }]
      : commitments;
    return derive(simSpent, simCommitments, goal, bufferTarget, currentDay, totalDays, openingBalance);
  }, [simulation, spent, commitments, goal, bufferTarget, currentDay, totalDays, openingBalance]);

  const shown = preview ?? real;

  const simulate = useCallback((s: Simulation) => {
    setHotStage(0);
    setAnnouncement("");
    setSimulation({ ...s, amount: Math.max(0, Math.round(s.amount)) });
  }, []);

  const discard = useCallback(() => {
    setSimulation(null);
    setHotStage(0);
    setAnnouncement("Simulation discarded. Nothing changed.");
  }, []);

  const apply = useCallback(() => {
    if (!simulation) return;
    const s = simulation;
    if (s.recurring) {
      simId += 1;
      setCommitments((c) => [...c, { id: `c-sim-${simId}`, label: s.label, amount: s.amount, day: Math.max(currentDay, s.day), recurring: "monthly" }]);
    } else {
      simId += 1;
      setSpent((prev) => [...prev, { id: `s-sim-${simId}`, label: s.label, amount: s.amount, day: Math.max(1, Math.min(totalDays, s.day)) }]);
    }
    setSimulation(null);
    const nextBalance = s.recurring ? real.balance : real.balance - s.amount;
    setAnnouncement(
      `Applied ${s.label} for ${formatINR(s.amount)}. Balance now ${formatINR(nextBalance)}.`,
    );
    if (reducedMotion) {
      setHotStage(0);
    } else {
      // Ordered stagger: 1 balance → 2 safe → 3 goal → 4 forecast → 5 health
      setHotStage(1);
      const timers = [2, 3, 4, 5].map(
        (stage, i) => window.setTimeout(() => setHotStage(stage), 300 * (i + 1)),
      );
      window.setTimeout(() => setHotStage(0), 300 * 5 + 1200);
      void timers;
    }
  }, [simulation, real.balance, currentDay, totalDays, reducedMotion]);

  return {
    spent, commitments, simulation, simulate, discard, apply,
    real, preview, shown, hotStage, announcement,
    goal, currentDay, totalDays, openingBalance, bufferTarget,
    reducedMotion,
  };
}

export type Budget = ReturnType<typeof useBudget>;
