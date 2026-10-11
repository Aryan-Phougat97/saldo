import { useRef, useState } from "react";
import "./index.css";
import { useBudget } from "./hooks/useBudget";
import { formatINR } from "./lib/finance";
import BreakdownDialog from "./components/BreakdownDialog";
import Wordmark from "./components/Wordmark";
import Simulator from "./components/Simulator";
import ForecastChart from "./components/ForecastChart";
import HealthScore from "./components/HealthScore";

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
  const budget = useBudget();
  const { real, shown, preview, hotStage, announcement, goal, currentDay, totalDays, spent, commitments } = budget;
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const safeTriggerRef = useRef<HTMLButtonElement>(null);

  const onTrack = shown.goalFinish <= goal.deadlineDay;
  const paceNote =
    shown.avg <= shown.safe
      ? `${formatINR(shown.safe - shown.avg)} under your daily pace.`
      : `${formatINR(shown.avg - shown.safe)} above your daily pace, smoothing out over the ${shown.daysLeft} days left.`;

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-6 sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-tight">
            <a href="#" className="hover:underline" aria-label="Back to Saldo overview">
              ← <Wordmark className="text-sm" />
            </a>
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
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusPill kind={onTrack ? "good" : "warn"} text={onTrack ? `Goal on track · day ${shown.goalFinish}` : `Goal slips to day ${shown.goalFinish}`} />
            <StatusPill kind={shown.forecast >= 0 ? "good" : "warn"} text={`Ends ${formatINR(shown.forecast)}`} />
          </div>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{paceNote}</p>
        </section>

        <Simulator budget={budget} />

        {/* Goal */}
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
            aria-valuenow={Math.round((goal.saved / goal.target) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${goal.label} progress`}
            className="mt-3 h-2 overflow-hidden rounded-full bg-[#efefe9]"
          >
            <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${(goal.saved / goal.target) * 100}%` }} />
          </div>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            {formatINR(shown.goalPace)} a day keeps you on track for day {goal.deadlineDay}. At today&apos;s safe
            amount, you&apos;d finish around <strong>day {shown.goalFinish}</strong>
            {shown.goalFinish > goal.deadlineDay
              ? ` — ${shown.goalFinish - goal.deadlineDay} days after the deadline.`
              : ", comfortably inside the month."}
          </p>
        </section>

        <ForecastChart budget={budget} hot={hotStage === 4} />
        <HealthScore budget={budget} hot={hotStage === 5} />

        {/* Lists */}
        <section aria-labelledby="lists-title" className="card p-6">
          <h2 id="lists-title" className="text-xl font-semibold tracking-tight">
            Where it stands
          </h2>
          <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Spent · {formatINR(real.balance ? budget.openingBalance - real.balance : 0)}</h3>
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
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <p className="text-sm text-[var(--color-ink-faint)]">
          Demo with mock data. No real money moves. Buffer target {formatINR(budget.bufferTarget)}.
        </p>
      </footer>

      <div aria-live="polite" className="visually-hidden">
        {announcement || `Balance ${formatINR(shown.balance)}. Safe to spend ${formatINR(shown.safe)}.`}
      </div>

      <BreakdownDialog budget={budget} open={breakdownOpen} onClose={() => setBreakdownOpen(false)} returnRef={safeTriggerRef} />
    </>
  );
}
