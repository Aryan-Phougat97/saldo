import { useState } from "react";
import { formatINR } from "../lib/finance";
import type { Budget } from "../hooks/useBudget";

export default function Simulator({ budget }: { budget: Budget }) {
  const { simulation, simulate, discard, apply, real, preview, currentDay, totalDays } = budget;
  const [label, setLabel] = useState("Headphones");
  const [amount, setAmount] = useState("1499");
  const [day, setDay] = useState(String(currentDay));
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState("");

  const startPreview = () => {
    const n = Number(amount);
    const d = Number(day);
    if (!label.trim()) {
      setError("Give the purchase a name.");
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter an amount above ₹0.");
      return;
    }
    if (!Number.isFinite(d) || d < 1 || d > totalDays) {
      setError(`Enter a day between 1 and ${totalDays}.`);
      return;
    }
    setError("");
    simulate({ label: label.trim(), amount: n, day: Math.round(d), recurring });
  };

  return (
    <section aria-labelledby="sim-title" className="card p-6">
      <h2 id="sim-title" className="text-xl font-semibold tracking-tight">
        Try a purchase first
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Preview the effect before anything moves. Nothing is final until you apply it.
      </p>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="sim-label" className="text-sm font-medium">
            What is it?
          </label>
          <input
            id="sim-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoComplete="off"
            className="min-h-[44px] rounded-xl border border-[var(--color-hairline)] bg-white px-3 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="sim-amount" className="text-sm font-medium">
              Amount (₹)
            </label>
            <input
              id="sim-amount"
              type="number"
              inputMode="numeric"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tnum min-h-[44px] rounded-xl border border-[var(--color-hairline)] bg-white px-3 text-base"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="sim-day" className="text-sm font-medium">
              Day
            </label>
            <input
              id="sim-day"
              type="number"
              inputMode="numeric"
              min={1}
              max={totalDays}
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="tnum min-h-[44px] rounded-xl border border-[var(--color-hairline)] bg-white px-3 text-base"
            />
          </div>
        </div>
        <div className="flex min-h-[44px] items-center gap-3">
          <input
            id="sim-recurring"
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="h-5 w-5 accent-[#0a5cf5]"
          />
          <label htmlFor="sim-recurring" className="text-sm">
            Monthly repeat <span className="text-[var(--color-ink-faint)]">(goes to commitments)</span>
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-[var(--color-warn-ink)]">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={startPreview}
          className="min-h-[44px] rounded-xl bg-[#1c1c1a] px-4 text-base font-medium text-white active:scale-[0.98]"
        >
          See preview
        </button>
      </div>

      {simulation && preview && (
        <div aria-live="polite" className="mt-5 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4">
          <h3 className="text-sm font-semibold">
            Preview: {simulation.label} · {formatINR(simulation.amount)}
            {simulation.recurring ? " · monthly" : ""}
          </h3>
          <dl className="mt-2 grid gap-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-ink-soft)]">Balance</dt>
              <dd className="tnum font-medium">
                {formatINR(real.balance)} → {formatINR(preview.balance)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-ink-soft)]">Safe to spend today</dt>
              <dd className="tnum font-medium">
                {formatINR(real.safe)} → {formatINR(preview.safe)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-ink-soft)]">Goal finishes</dt>
              <dd className="tnum font-medium">
                Day {real.goalFinish} → Day {preview.goalFinish}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-ink-soft)]">Month-end forecast</dt>
              <dd className="tnum font-medium">
                {formatINR(real.forecast)} → {formatINR(preview.forecast)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            {simulation.amount > real.safe
              ? `${formatINR(simulation.amount)} is about ${(simulation.amount / Math.max(1, real.safe)).toFixed(1)}× today's safe amount of ${formatINR(real.safe)}. Applied, each of the ${real.daysLeft} remaining days averages ${formatINR(preview.safe)}.`
              : `Within today's safe amount of ${formatINR(real.safe)}. Applied, tomorrow starts at ${formatINR(preview.safe)} a day.`}
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
    </section>
  );
}
