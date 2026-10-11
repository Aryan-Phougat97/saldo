import { useState } from "react";
import type { Budget } from "../state/store";

type PartKey = "liquidity" | "commitment" | "goal" | "steadiness";

const PARTS: Array<{ key: PartKey; name: string; move: string }> = [
  {
    key: "liquidity",
    name: "Cash cushion",
    move: "It rises when your balance grows well above your ₹600 buffer, and falls as spending brings you closer to it.",
  },
  {
    key: "commitment",
    name: "Bills ahead",
    move: "It rises when upcoming bills shrink against your balance, and falls when big due dates stack up.",
  },
  {
    key: "goal",
    name: "Goal pace",
    move: "It rises when savings keep up with the days passed, and falls if saving stalls while the deadline nears.",
  },
  {
    key: "steadiness",
    name: "Spending rhythm",
    move: "It rises when daily spending stays even, and falls after one very large day next to quiet ones.",
  },
];

export default function HealthScore({ budget, hot }: { budget: Budget; hot: boolean }) {
  const { shown } = budget;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const h = shown.health;

  return (
    <section aria-labelledby="health-title" className={`card pulse-stage p-6 ${hot ? "is-hot" : ""}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="health-title" className="text-xl font-semibold tracking-tight">
          Money steadiness
        </h2>
        <p className="tnum text-2xl font-semibold tracking-tight">{h.overall}<span className="text-sm font-normal text-[var(--color-ink-faint)]"> / 100</span></p>
      </div>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        A quiet signal, not a grade. Four parts, each with its own story.
      </p>
      <ul className="mt-4 grid gap-2">
        {PARTS.map((p) => {
          const value: number = h[p.key];
          const open = openKey === p.key;
          return (
            <li key={p.key} className="rounded-2xl border border-[var(--color-hairline)]">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenKey(open ? null : p.key)}
                className="grid min-h-[44px] w-full gap-1 p-3 text-left"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="tnum text-sm text-[var(--color-ink-soft)]">{value} / 100</span>
                </span>
                <span
                  role="progressbar"
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={p.name}
                  className="h-1.5 overflow-hidden rounded-full bg-[#efefe9]"
                >
                  <span className="block h-full rounded-full bg-[#1c1c1a]" style={{ width: `${value}%` }} />
                </span>
              </button>
              {open && <p className="px-3 pb-3 text-sm text-[var(--color-ink-soft)]">{p.move}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
