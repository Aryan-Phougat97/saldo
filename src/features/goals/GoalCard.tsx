import { useState } from "react";
import { formatINR } from "../../lib/format";
import type { Budget } from "../../state/store";

/**
 * Savings goal with a live finish date and a transfer action: move cash into
 * the goal, preview the effect on the finish day and the daily number first.
 */
export default function GoalCard({ budget }: { budget: Budget }) {
  const { goal, real, preview, simulation, simulate, apply, discard, hotStage } = budget;
  const [amount, setAmount] = useState("500");
  const [error, setError] = useState("");

  if (!goal) {
    return (
      <section aria-labelledby="goal-title" className="card p-6">
        <h2 id="goal-title" className="text-xl font-semibold tracking-tight">
          Goals
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          No goals yet. Everything you keep still counts toward the buffer.
        </p>
      </section>
    );
  }

  const transferDraft =
    simulation && simulation.kind === "transfer-goal" ? simulation : null;

  const startTransfer = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter an amount above ₹0 to move.");
      return;
    }
    if (n > 100000) {
      setError("Keep it under ₹1,00,000 — this demo covers one small month.");
      return;
    }
    setError("");
    simulate({ kind: "transfer-goal", goalId: goal.id, amount: n });
  };

  const progress = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;

  return (
    <section aria-labelledby="goal-title" className={`card pulse-stage p-6 ${hotStage === 3 ? "is-hot" : ""}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="goal-title" className="text-xl font-semibold tracking-tight">
          {goal.label}
        </h2>
        <p className="tnum text-sm font-medium">
          {formatINR(goal.saved)} of {formatINR(goal.target)}
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.label} progress`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-[#efefe9]"
      >
        <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
        {formatINR(real.goalPace)} a day keeps you on track for day {goal.deadlineDay}. At
        today&apos;s safe amount, you&apos;d finish around{" "}
        <strong>day {real.goalFinish}</strong>
        {real.goalFinish > goal.deadlineDay
          ? ` — ${real.goalFinish - goal.deadlineDay} days after the deadline.`
          : ", comfortably inside the month."}
      </p>

      <div className="mt-4 border-t border-[var(--color-hairline)] pt-4">
        <label htmlFor="transfer-amount" className="text-sm font-medium">
          Move cash into {goal.label} (₹)
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="transfer-amount"
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tnum min-h-[44px] w-full rounded-xl border border-[var(--color-hairline)] bg-white px-3 text-base"
          />
          <button
            type="button"
            onClick={startTransfer}
            className="min-h-[44px] shrink-0 rounded-xl bg-[#1c1c1a] px-4 text-base font-medium text-white active:scale-[0.98]"
          >
            Preview
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-1.5 text-sm font-medium text-[var(--color-warn-ink)]">
            {error}
          </p>
        )}
        {transferDraft && preview && (
          <div aria-live="polite" className="mt-3 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4 text-sm">
            <p>
              Saved <strong className="tnum">{formatINR(goal.saved)} → {formatINR(goal.saved + transferDraft.amount)}</strong>
              {" "}· finishes <strong>day {real.goalFinish} → day {preview.goalFinish}</strong>
            </p>
            <p className="mt-1 text-[var(--color-ink-soft)]">
              Safe to spend becomes <strong className="tnum">{formatINR(preview.safe)}</strong> a day.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={apply}
                className="min-h-[44px] flex-1 rounded-xl bg-[var(--color-accent)] px-4 text-base font-medium text-white active:scale-[0.98]"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={discard}
                className="min-h-[44px] flex-1 rounded-xl border border-[var(--color-hairline)] bg-white px-4 text-base font-medium active:scale-[0.98]"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
