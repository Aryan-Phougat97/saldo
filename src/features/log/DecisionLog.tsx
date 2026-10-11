import { formatINR } from "../../lib/format";
import type { Budget } from "../../state/store";

/**
 * Short log of applied decisions for the month — what moved, on which day,
 * and for how much. Discarded simulations never appear here.
 */
export default function DecisionLog({ budget }: { budget: Budget }) {
  const { log } = budget;

  return (
    <section aria-labelledby="log-title" className="card p-6">
      <h2 id="log-title" className="text-xl font-semibold tracking-tight">
        Decision log
      </h2>
      {log.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          No decisions yet. Simulate something above — only applied choices land here.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--color-hairline)]">
          {log.map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <div>
                <p className="font-medium">{e.label}</p>
                <p className="text-[var(--color-ink-faint)]">Day {e.day}</p>
              </div>
              <p className="tnum font-medium">{formatINR(e.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
