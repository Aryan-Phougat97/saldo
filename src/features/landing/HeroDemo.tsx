import { useMemo, useState } from "react";
import { seed } from "../../data/seed";
import { selectDerived, selectPreview } from "../../domain/selectors";
import { buildForecastSeries, linePath } from "../../lib/series";
import { formatINR } from "../../lib/format";
import { contextOf, createInitialState, scenarioOf } from "../../state/store";
import MonthStrip from "./MonthStrip";
import { CHIPS, type Chip } from "./content";

/**
 * The landing hero's playable demo: the same seed, engine, and series as the
 * app, with one-tap sample purchases. Preview-only — applying happens in the
 * full demo behind "Apply it for real".
 */
export default function HeroDemo() {
  const [chip, setChip] = useState<Chip | null>(null);

  const base = useMemo(() => selectDerived(createInitialState(), scenarioOf()), []);
  const line = useMemo(
    () =>
      buildForecastSeries({
        spent: seed.spent,
        commitments: seed.commitments,
        openingBalance: seed.openingBalance,
        balance: base.balance,
        avg: base.avg,
        currentDay: seed.currentDay,
        totalDays: seed.totalDays,
      }),
    [base],
  );

  const sim = useMemo(() => {
    if (!chip) return null;
    return selectPreview(
      createInitialState(),
      { kind: "purchase", label: chip.label, amount: chip.amount, day: seed.currentDay },
      scenarioOf(),
      contextOf(),
    );
  }, [chip]);

  const shown = {
    safe: sim?.safe ?? base.safe,
    balance: sim?.balance ?? base.balance,
    forecast: sim?.forecast ?? base.forecast,
    finish: sim?.goalFinish ?? base.goalFinish,
  };

  return (
    <div className="card p-6 sm:p-7" aria-label="Interactive preview. Pick a purchase to see the numbers move.">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Try a decision, right here</p>
        <p className="tnum rounded-full border border-[var(--color-hairline)] px-3 py-1 text-xs font-medium">
          Day {seed.currentDay} of {seed.totalDays}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Sample purchases">
        {CHIPS.map((c) => {
          const active = chip?.label === c.label;
          return (
            <button
              key={c.label}
              type="button"
              aria-pressed={active}
              onClick={() => setChip(active ? null : c)}
              className={`tnum flex min-h-[44px] items-center rounded-xl border px-3 text-sm font-medium active:scale-[0.98] ${
                active
                  ? "border-[var(--color-accent)] bg-[#eef4ff] text-[var(--color-accent-ink)]"
                  : "border-[var(--color-hairline)] bg-white"
              }`}
            >
              {c.label} · {formatINR(c.amount)}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-4">
        <p className="text-sm text-[var(--color-ink-soft)]">
          {chip
            ? `With ${chip.label} (${formatINR(chip.amount)}) — safe to spend becomes`
            : "Safe to spend today"}
        </p>
        <p key={shown.safe} className="swap tnum mt-1 text-6xl font-semibold tracking-tight">
          {formatINR(shown.safe)}
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {chip ? (
            <>
              Goal finishes <strong>day {shown.finish}</strong>
              {shown.finish > seed.goals[0].deadlineDay
                ? ` — ${shown.finish - seed.goals[0].deadlineDay} days past the deadline.`
                : ", still inside the month."}{" "}
              Month ends near <strong className="tnum">{formatINR(shown.forecast)}</strong>.
            </>
          ) : (
            <>
              Balance <strong className="tnum">{formatINR(shown.balance)}</strong> · Goa fund finishes{" "}
              <strong>day {shown.finish}</strong> · Month ends near{" "}
              <strong className="tnum">{formatINR(shown.forecast)}</strong>.
            </>
          )}
        </p>
      </div>

      <svg
        viewBox="0 0 300 80"
        role="img"
        aria-label="Projected balance line for the 30 day month"
        className="mt-3 w-full"
      >
        <path
          d={linePath(line, 300, 80, 4)}
          fill="none"
          stroke="#1c1c1a"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-3">
        <MonthStrip />
      </div>
      <a
        href="#/app"
        className="mt-5 flex min-h-[44px] items-center justify-center rounded-xl bg-[#1c1c1a] px-4 text-base font-medium text-white active:scale-[0.98]"
      >
        Apply it for real in the demo
      </a>
    </div>
  );
}
