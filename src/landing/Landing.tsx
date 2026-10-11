import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  calcAvgDailySpend,
  calcBalance,
  calcCommittedAhead,
  calcDaysLeft,
  calcForecastEnd,
  calcGoalFinishDay,
  calcSafeToSpend,
  calcSpendable,
  formatINR,
} from "../lib/finance";
import { seed } from "../state/seed";
import Wordmark from "../components/Wordmark";

/* ---------- shared ---------- */

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

function spark(values: number[], w: number, h: number): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = 4 + (i / Math.max(1, values.length - 1)) * (w - 8);
      const y = h - 4 - ((v - min) / span) * (h - 8);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/* ---------- numbers (same seed + formulas as the app) ---------- */

interface Chip {
  label: string;
  amount: number;
}

const CHIPS: Chip[] = [
  { label: "Headphones", amount: 1499 },
  { label: "Sneakers", amount: 2999 },
  { label: "Concert night", amount: 999 },
  { label: "Trip advance", amount: 5000 },
];

function useMonth() {
  return useMemo(() => {
    const balance = calcBalance(seed.openingBalance, seed.spent);
    const committed = calcCommittedAhead(seed.commitments, seed.currentDay, seed.totalDays);
    const daysLeft = calcDaysLeft(seed.totalDays, seed.currentDay);
    const spendable = calcSpendable(balance, committed, seed.bufferTarget);
    const safe = calcSafeToSpend(spendable, daysLeft);
    const avg = calcAvgDailySpend(seed.spent, seed.currentDay);
    const forecast = calcForecastEnd(balance, committed, avg, daysLeft);
    const goal = seed.goals[0];
    const finish = calcGoalFinishDay(goal, seed.currentDay, safe);

    const cumSpent = new Array(seed.totalDays + 1).fill(0) as number[];
    for (const s of seed.spent) for (let d = s.day; d <= seed.totalDays; d++) cumSpent[d] += s.amount;
    const cumCommit = new Array(seed.totalDays + 1).fill(0) as number[];
    for (const c of seed.commitments) for (let d = c.day; d <= seed.totalDays; d++) cumCommit[d] += c.amount;
    const line: number[] = [];
    for (let d = 1; d <= seed.totalDays; d++) {
      if (d < seed.currentDay) line.push(seed.openingBalance - cumSpent[d]);
      else line.push(balance - (cumCommit[d] - cumCommit[seed.currentDay - 1]) - avg * (d - seed.currentDay + 1));
    }
    return { balance, committed, daysLeft, safe, avg, forecast, finish, goal, line };
  }, []);
}

/* ---------- month strip ---------- */

function MonthStrip() {
  const spentDays = useMemo(() => new Set(seed.spent.map((s) => s.day)), []);
  const billDays = useMemo(() => new Set(seed.commitments.map((c) => c.day)), []);
  const cells = Array.from({ length: seed.totalDays }, (_, i) => i + 1);
  return (
    <div>
      <div aria-hidden="true" className="grid grid-cols-15 gap-1 sm:grid-cols-30">
        {cells.map((d) => {
          const isToday = d === seed.currentDay;
          const isSpent = spentDays.has(d);
          const isBill = billDays.has(d);
          const isPast = d < seed.currentDay;
          let cls = "border-[var(--color-hairline)] bg-white";
          if (isSpent) cls = "border-[#1c1c1a] bg-[#1c1c1a]";
          else if (isBill) cls = "border-[var(--color-accent)] bg-[#eef4ff]";
          else if (isPast) cls = "border-[var(--color-hairline)] bg-[#f1f1ec]";
          return (
            <span
              key={d}
              title={`Day ${d}${isSpent ? " · spent" : ""}${isBill ? " · bill due" : ""}${isToday ? " · today" : ""}`}
              className={`flex aspect-square min-w-0 items-center justify-center rounded-md border text-[9px] font-semibold ${
                isSpent ? "text-white" : "text-[var(--color-ink-faint)]"
              } ${isToday ? "outline outline-2 outline-offset-1 outline-[#0a5cf5]" : ""} ${cls}`}
            >
              {d === seed.currentDay || d === seed.goals[0].deadlineDay ? d : ""}
            </span>
          );
        })}
      </div>
      <p className="visually-hidden">
        Spent on days {[...spentDays].join(", ")}. Bills due on days {[...billDays].join(", ")}. Today is day{" "}
        {seed.currentDay}. Goal deadline day {seed.goals[0].deadlineDay}.
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1c1c1a]" /> Spent
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm border border-[var(--color-accent)] bg-[#eef4ff]" /> Bill due
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm outline outline-2 outline-[#0a5cf5]" /> Today
        </span>
      </div>
    </div>
  );
}

/* ---------- content ---------- */

const MOMENTS = [
  {
    tag: "The 11pm order",
    story: "Food delivery, ₹640, day 9. It felt small at midnight. By morning it had quietly rewritten the next ten days.",
    move: "Saldo move: the daily number absorbs it overnight — no lecture, just a smaller figure with the reason attached.",
  },
  {
    tag: "The sale weekend",
    story: "Sneakers at 40% off, still ₹2,999 out the door. The discount is real; so is the Goa fund watching from day 30.",
    move: "Saldo move: simulate it first. If the goal date slips two days, you decide with both facts in hand.",
  },
  {
    tag: "The Goa fund",
    story: "₹1,200 saved of ₹4,500 with 19 days left. Close enough to protect, far enough to lose without noticing.",
    move: "Saldo move: every simulation shows the goal's finish day — on track, or the exact new date.",
  },
];

const CASCADE = [
  ["Balance drops", "The rupee leaves, visibly."],
  ["Today's number recalculates", "The remaining days split what's left."],
  ["The goal date moves", "Goa in 8 days, or 10 — you see it shift."],
  ["The forecast bends", "The 30-day line redraws around the decision."],
  ["Steadiness shifts", "Four quiet parts, each showing its story."],
];

const FORMULAS = [
  ["balance", "opening − spent"],
  ["bills ahead", "due day 12–30"],
  ["spendable", "balance − bills − ₹600 buffer"],
  ["safe today", "spendable ÷ 19 days, rounded down"],
  ["goal pace", "₹3,300 left ÷ 19 days"],
  ["forecast", "balance − bills − daily pace × days left"],
];

const FAQS = [
  {
    q: "Is any of this real money?",
    a: "No. The demo runs on a fixed mock month — ₹10,000, 30 days, starting day 12. Nothing connects to a bank, nothing leaves your browser, nothing is saved.",
  },
  {
    q: "Do I need an account?",
    a: "There isn't one. Open the demo and it's already day 12 with spending history, upcoming bills, and a Goa fund waiting. State lives in memory and resets on reload.",
  },
  {
    q: "What if I blow past the safe amount?",
    a: "The number recalculates, the goal date slips to its new day, the forecast bends. No red warnings, no grades — just the consequence, stated plainly, with the days left to absorb it.",
  },
  {
    q: "What happens after day 30?",
    a: "Honestly: the demo ends there. A real version would close the month, carry the buffer forward, and start a fresh 30 days. That's the next thing to build.",
  },
];

/* ---------- page ---------- */

export default function Landing() {
  const m = useMonth();
  const [chip, setChip] = useState<Chip | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const sim = useMemo(() => {
    if (!chip) return null;
    const balance = m.balance - chip.amount;
    const spendable = calcSpendable(balance, m.committed, seed.bufferTarget);
    const safe = calcSafeToSpend(spendable, m.daysLeft);
    const forecast = calcForecastEnd(balance, m.committed, m.avg, m.daysLeft);
    const finish = calcGoalFinishDay(m.goal, seed.currentDay, safe);
    return { balance, safe, forecast, finish };
  }, [chip, m]);

  const shown = {
    safe: sim?.safe ?? m.safe,
    balance: sim?.balance ?? m.balance,
    forecast: sim?.forecast ?? m.forecast,
    finish: sim?.finish ?? m.finish,
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-hairline)] bg-[#fafaf7]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <p className="text-base font-semibold tracking-tight">
            <Wordmark />
          </p>
          <nav aria-label="Page" className="hidden items-center gap-6 text-sm sm:flex">
            <a href="#moments" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              Moments
            </a>
            <a href="#how" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              How it works
            </a>
            <a href="#maths" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              The maths
            </a>
            <a href="#faq" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              FAQ
            </a>
          </nav>
          <a
            href="#/app"
            className="flex min-h-[44px] items-center rounded-xl bg-[#1c1c1a] px-4 text-sm font-medium text-white active:scale-[0.98]"
          >
            Open the demo
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section aria-labelledby="landing-title" className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
              Saldo · a 30-day budget companion
            </p>
            <h1 id="landing-title" className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Know what a purchase costs before you buy.
            </h1>
            <p className="mt-4 max-w-[45ch] text-base leading-relaxed text-[var(--color-ink-soft)]">
              Saldo turns a ₹10,000 month into one daily number. Simulate any spend, see what moves, then decide.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="#/app"
                className="flex min-h-[44px] items-center rounded-xl bg-[var(--color-accent)] px-5 text-base font-medium text-white active:scale-[0.98]"
              >
                Open the full demo
              </a>
              <a
                href="#maths"
                className="flex min-h-[44px] items-center rounded-xl border border-[var(--color-hairline)] bg-white px-5 text-base font-medium active:scale-[0.98]"
              >
                How the maths works
              </a>
            </div>
          </div>

          {/* Interactive hero demo: real numbers, try it here */}
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
                {chip ? `With ${chip.label} (${formatINR(chip.amount)}) — safe to spend becomes` : "Safe to spend today"}
              </p>
              <p key={shown.safe} className="swap tnum mt-1 text-6xl font-semibold tracking-tight">
                {formatINR(shown.safe)}
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                {chip ? (
                  <>
                    Goal finishes <strong>day {shown.finish}</strong>
                    {shown.finish > m.goal.deadlineDay
                      ? ` — ${shown.finish - m.goal.deadlineDay} days past the deadline.`
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

            <svg viewBox="0 0 300 80" role="img" aria-label="Projected balance line for the 30 day month" className="mt-3 w-full">
              <path d={spark(m.line, 300, 80)} fill="none" stroke="#1c1c1a" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
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
        </section>

        {/* Trust strip */}
        <div className="border-y border-[var(--color-hairline)] py-3">
          <p className="text-center text-sm text-[var(--color-ink-faint)]">
            Mock data · No login · No real money · Built in a 6-hour hackathon
          </p>
        </div>

        {/* Moments */}
        <section aria-labelledby="moments-title" id="moments" className="scroll-mt-20 py-12 sm:py-16">
          <Reveal>
            <h2 id="moments-title" className="max-w-[22ch] text-2xl font-semibold tracking-tight md:text-4xl">
              Made for the moments that break budgets.
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {MOMENTS.map((s, i) => (
              <Reveal key={s.tag} className={i === 1 ? "lg:mt-10" : ""}>
                <article className="card flex h-full flex-col p-6">
                  <p className="tnum text-sm font-semibold text-[var(--color-accent-ink)]">0{i + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.tag}</h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--color-ink-soft)]">{s.story}</p>
                  <p className="mt-4 border-t border-[var(--color-hairline)] pt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {s.move}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Cascade */}
        <section aria-labelledby="cascade-title" id="how" className="grid scroll-mt-20 gap-8 border-t border-[var(--color-hairline)] py-12 sm:py-16 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div>
              <h2 id="cascade-title" className="text-2xl font-semibold tracking-tight md:text-4xl">
                One decision moves five things.
              </h2>
              <p className="mt-3 max-w-[45ch] text-base leading-relaxed text-[var(--color-ink-soft)]">
                Apply a simulated purchase and the page updates in order — so you can watch the consequence travel.
              </p>
              <a
                href="#/app"
                className="mt-5 inline-flex min-h-[44px] items-center rounded-xl border border-[var(--color-hairline)] bg-white px-5 text-base font-medium active:scale-[0.98]"
              >
                Watch it happen
              </a>
            </div>
          </Reveal>
          <Reveal>
            <ol className="card divide-y divide-[var(--color-hairline)] px-6">
              {CASCADE.map(([title, body], i) => (
                <li key={title} className="flex items-baseline gap-4 py-4">
                  <span className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{title}</h3>
                    <p className="text-sm text-[var(--color-ink-soft)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* Maths */}
        <section aria-labelledby="maths-title" id="maths" className="scroll-mt-20 border-t border-[var(--color-hairline)] py-12 sm:py-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="maths-title" className="max-w-[20ch] text-2xl font-semibold tracking-tight md:text-4xl">
                The maths is on the table.
              </h2>
              <p className="tnum rounded-full bg-[var(--color-good-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-good-ink)]">
                <span aria-hidden="true">● </span>12 unit tests, all passing
              </p>
            </div>
            <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-[var(--color-ink-soft)]">
              No black box, no score-as-grade. Every number in the demo comes from these lines — tap any figure in the
              app to see its working.
            </p>
          </Reveal>
          <Reveal>
            <dl className="mt-8 grid gap-px overflow-hidden rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-hairline)] sm:grid-cols-2 lg:grid-cols-3">
              {FORMULAS.map(([term, def]) => (
                <div key={term} className="bg-white px-5 py-4">
                  <dt className="text-sm font-semibold">{term}</dt>
                  <dd className="tnum mt-0.5 text-sm text-[var(--color-ink-soft)]">{def}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" id="faq" className="scroll-mt-20 border-t border-[var(--color-hairline)] py-12 sm:py-16">
          <Reveal>
            <h2 id="faq-title" className="text-2xl font-semibold tracking-tight md:text-4xl">
              Fair questions.
            </h2>
          </Reveal>
          <div className="mx-auto mt-6 max-w-3xl">
            {FAQS.map((f, i) => {
              const open = faqOpen === i;
              return (
                <Reveal key={f.q}>
                  <div className="border-b border-[var(--color-hairline)]">
                    <h3>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`faq-panel-${i}`}
                        id={`faq-button-${i}`}
                        onClick={() => setFaqOpen(open ? null : i)}
                        className="flex min-h-[56px] w-full items-center justify-between gap-4 py-4 text-left text-base font-medium"
                      >
                        {f.q}
                        <span aria-hidden="true" className="tnum text-xl font-normal text-[var(--color-ink-faint)]">
                          {open ? "−" : "+"}
                        </span>
                      </button>
                    </h3>
                    {open && (
                      <p id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-button-${i}`} className="max-w-[65ch] pb-5 text-base leading-relaxed text-[var(--color-ink-soft)]">
                        {f.a}
                      </p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Closing CTA */}
        <section aria-labelledby="cta-title" className="card mb-14 px-6 py-12 text-center sm:px-12 sm:py-16">
          <Reveal>
            <h2 id="cta-title" className="mx-auto max-w-[20ch] text-2xl font-semibold tracking-tight md:text-4xl">
              Decide your next purchase with open eyes.
            </h2>
            <p className="mx-auto mt-3 max-w-[50ch] text-base text-[var(--color-ink-soft)]">
              Day 12 of 30, ₹8,830 in hand, Goa on the horizon. Step in and try a decision.
            </p>
            <a
              href="#/app"
              className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-[var(--color-accent)] px-6 text-base font-medium text-white active:scale-[0.98]"
            >
              Enter the demo
            </a>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[var(--color-hairline)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1fr_1fr_1fr] sm:px-6">
          <div>
            <p className="text-base font-semibold tracking-tight">
            <Wordmark />
          </p>
            <p className="mt-2 max-w-[35ch] text-sm leading-relaxed text-[var(--color-ink-soft)]">
              A calm budget companion for a ₹10,000 month. Simulate first, spend second.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-2 grid gap-1 text-sm text-[var(--color-ink-soft)]">
              <li><a href="#/app" className="inline-flex min-h-[32px] items-center hover:text-[var(--color-ink)]">Live demo</a></li>
              <li><a href="#moments" className="inline-flex min-h-[32px] items-center hover:text-[var(--color-ink)]">Moments</a></li>
              <li><a href="#how" className="inline-flex min-h-[32px] items-center hover:text-[var(--color-ink)]">How it works</a></li>
              <li><a href="#maths" className="inline-flex min-h-[32px] items-center hover:text-[var(--color-ink)]">The maths</a></li>
            </ul>
          </nav>
          <div>
            <p className="text-sm font-semibold">Project</p>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-[var(--color-ink-soft)]">
              A 6-hour hackathon build with mock data. Nothing here moves real money, and nothing leaves your browser.
            </p>
          </div>
        </div>
        <div className="border-t border-[var(--color-hairline)]">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-sm text-[var(--color-ink-faint)] sm:px-6">
            Saldo — spend second, simulate first.
          </p>
        </div>
      </footer>
    </>
  );
}
