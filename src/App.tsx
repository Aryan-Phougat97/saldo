import { Suspense, lazy, useRef, useState } from "react";
import "./styles/index.css";
import { useBudgetStore } from "./state/store";
import { formatINR } from "./lib/format";
import Wordmark from "./components/Wordmark";
import Simulator from "./components/Simulator";
import ForecastChart from "./components/ForecastChart";
import HealthScore from "./components/HealthScore";
import RiskBadge from "./features/risk/RiskBadge";
import GoalCard from "./features/goals/GoalCard";
import Subscriptions from "./features/subscriptions/Subscriptions";
import Shocks from "./features/shocks/Shocks";
import DecisionLog from "./features/log/DecisionLog";

// Behind a tap, so it rides in a separate chunk. The null fallback causes no
// layout shift — the dialog renders in a fixed overlay, never in flow.
const BreakdownDialog = lazy(() => import("./components/BreakdownDialog"));

function StatusPill({ kind, text }: { kind: "good" | "warn"; text: string }) {
  const styles =
    kind === "good"
      ? "bg-[var(--color-good-bg)] text-[var(--color-good-ink)]"
      : "bg-[var(--color-warn-bg)] text-[var(--color-warn-ink)]";
  const icon = kind === "good" ? "●" : "▲";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${styles}`}>
      <span aria-hidden="true">{icon}</span> {text}
    </span>
  );
}

export default function App() {
  const budget = useBudgetStore();
  const { real, shown, preview, hotStage, announcement, goal, currentDay, totalDays, spent, commitments, income, openingBase, openingBalance, bufferTarget, resetScenario } = budget;
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const safeTriggerRef = useRef<HTMLButtonElement>(null);

  const onTrack = goal ? shown.goalFinish <= goal.deadlineDay : true;
  const spentTotal = openingBalance - real.balance;
  const paceNote =
    shown.balance <= 0
      ? "Balance is at zero — every rupee from here is borrowed from bills or buffer. The breakdown above shows exactly where it went."
      : shown.avg <= shown.safe
        ? `${formatINR(shown.safe - shown.avg)} under your daily pace.`
        : `${formatINR(shown.avg - shown.safe)} above your daily pace, smoothing out over the ${shown.daysLeft} days left.`;

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-6 sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-tight">
            <button
              type="button"
              onClick={() => {
                window.location.hash = "#";
              }}
              className="hover:underline"
              aria-label="Back to Saldo overview"
            >
              ← <Wordmark className="text-sm" />
            </button>
          </p>
          <p className="text-sm text-[var(--color-ink-soft)]">See what a purchase does before you buy.</p>
        </div>
        <p className="tnum rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium">
          Day {currentDay} of {totalDays}
        </p>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-2">
        {/* Hero */}
        <section aria-labelledby="hero-title" className="card p-6 sm:p-8">
          <h1 id="hero-title" className="text-xl font-semibold tracking-tight">
            Your month at a glance
          </h1>
          <div aria-live="polite" className="mt-4">
            <p className="text-sm text-[var(--color-ink-soft)]">Balance</p>
            <p className={`pulse-stage tnum text-3xl font-semibold tracking-tight ${hotStage === 1 ? "is-hot rounded-xl" : ""}`}>
              {formatINR(shown.balance)}
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              Opens at {formatINR(openingBalance)} — {formatINR(openingBase)} cash
              {income.map((i) => ` + ${formatINR(i.amount)} ${i.label.toLowerCase()} (day ${i.day})`).join("")}.
            </p>
            <p className="mt-5 text-sm text-[var(--color-ink-soft)]">Safe to spend today</p>
            <button
              ref={safeTriggerRef}
              type="button"
              onClick={() => setBreakdownOpen(true)}
              aria-haspopup="dialog"
              className={`pulse-stage hero-number mt-1 rounded-2xl px-2 text-left active:scale-[0.99] ${hotStage === 2 ? "is-hot" : ""}`}
            >
              {formatINR(shown.safe)}
            </button>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Tap the number to see the maths. {preview && <strong>Previewing — nothing applied yet.</strong>}
            </p>
            <p className="tnum mt-2 text-sm text-[var(--color-ink-soft)]">
              Reconciled: {formatINR(openingBalance)} − {formatINR(spentTotal)} spent −{" "}
              {formatINR(real.committedAhead)} bills = {formatINR(real.spendable)} free +{" "}
              {formatINR(bufferTarget)} buffer.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusPill kind={onTrack ? "good" : "warn"} text={goal ? (onTrack ? `Goal on track · day ${shown.goalFinish}` : `Goal slips to day ${shown.goalFinish}`) : "No goal set"} />
            <StatusPill kind={shown.forecast >= 0 ? "good" : "warn"} text={`Ends ${formatINR(shown.forecast)}`} />
          </div>
          <div className="mt-3">
            <RiskBadge risk={shown.risk} />
          </div>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{paceNote}</p>
        </section>

        <Simulator budget={budget} />

        <GoalCard budget={budget} />

        <ForecastChart budget={budget} hot={hotStage === 4} />
        <HealthScore budget={budget} hot={hotStage === 5} />

        <Subscriptions budget={budget} />
        <Shocks budget={budget} />

        {/* Lists */}
        <section aria-labelledby="lists-title" className="card p-6">
          <h2 id="lists-title" className="text-xl font-semibold tracking-tight">
            Where it stands
          </h2>
          <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Spent · {formatINR(budget.openingBalance - real.balance)}</h3>
              <ul className="mt-1 divide-y divide-[var(--color-hairline)] text-sm">
                {spent.map((s) => (
                  <li key={s.id} className="flex justify-between gap-3 py-2">
                    <span>{s.label} <span className="text-[var(--color-ink-faint)]">· day {s.day}</span></span>
                    <span className="tnum font-medium">{formatINR(s.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Upcoming · {formatINR(real.committedAhead)}</h3>
              <ul className="mt-1 divide-y divide-[var(--color-hairline)] text-sm">
                {commitments.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 py-2">
                    <span>{c.label} <span className="text-[var(--color-ink-faint)]">· day {c.day}</span></span>
                    <span className="tnum font-medium">{formatINR(c.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <DecisionLog budget={budget} />
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-10 sm:px-6">
        <p className="text-sm text-[var(--color-ink-faint)]">
          Demo with mock data. No real money moves. Buffer target {formatINR(budget.bufferTarget)}.
        </p>
        <button
          type="button"
          onClick={resetScenario}
          className="min-h-[44px] rounded-xl border border-[var(--color-hairline)] bg-white px-4 text-sm font-medium active:scale-[0.98]"
        >
          Reset demo
        </button>
      </footer>

      <div aria-live="polite" className="visually-hidden">
        {announcement || `Balance ${formatINR(shown.balance)}. Safe to spend ${formatINR(shown.safe)}.`}
      </div>

      <Suspense fallback={null}>
        <BreakdownDialog budget={budget} open={breakdownOpen} onClose={() => setBreakdownOpen(false)} returnRef={safeTriggerRef} />
      </Suspense>
    </>
  );
}
