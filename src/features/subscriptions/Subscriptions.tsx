import { formatINR } from "../../lib/format";
import { cancellationImpact } from "../../domain/decisions";
import type { Budget } from "../../state/store";

/**
 * Recurring bills with a cancel action. Previewing a cancellation shows what
 * the month keeps (30-day impact) plus what a full year of the subscription
 * would have cost (annual impact) — then Apply or Discard as usual.
 */
export default function Subscriptions({ budget }: { budget: Budget }) {
  const { commitments, cancelled, simulation, simulate, apply, discard, real, preview } = budget;
  const recurring = commitments.filter((c) => c.recurring);

  const cancelDraft =
    simulation && simulation.kind === "cancel-subscription" ? simulation : null;
  const cancelTarget = cancelDraft
    ? commitments.find((c) => c.id === cancelDraft.commitmentId) ?? null
    : null;

  return (
    <section aria-labelledby="subs-title" className="card p-6">
      <h2 id="subs-title" className="text-xl font-semibold tracking-tight">
        Subscriptions
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Monthly repeats. Cancel one to see what the month — and the year — keeps.
      </p>

      {recurring.length === 0 && cancelled.length === 0 && (
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          No subscriptions on the books.
        </p>
      )}

      <ul className="mt-3 divide-y divide-[var(--color-hairline)]">
        {recurring.map((c) => {
          const impact = cancellationImpact(c.amount);
          return (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="text-sm">
                <p className="font-medium">
                  {c.label} <span className="text-[var(--color-ink-faint)]">· day {c.day}</span>
                </p>
                <p className="tnum text-[var(--color-ink-soft)]">
                  {formatINR(impact.monthly)}/mo · {formatINR(impact.annual)}/yr
                </p>
              </div>
              <button
                type="button"
                onClick={() => simulate({ kind: "cancel-subscription", commitmentId: c.id })}
                className="min-h-[44px] shrink-0 rounded-xl border border-[var(--color-hairline)] bg-white px-4 text-sm font-medium active:scale-[0.98]"
              >
                Simulate cancel
              </button>
            </li>
          );
        })}
      </ul>

      {cancelDraft && cancelTarget && preview && (
        <div aria-live="polite" className="mt-3 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4 text-sm">
          <p className="font-semibold">Preview: cancel {cancelTarget.label}</p>
          <p className="tnum mt-1">
            Month keeps <strong>{formatINR(cancellationImpact(cancelTarget.amount).monthly)}</strong> · year would have cost{" "}
            <strong>{formatINR(cancellationImpact(cancelTarget.amount).annual)}</strong>
          </p>
          <p className="tnum mt-1 text-[var(--color-ink-soft)]">
            Safe to spend {formatINR(real.safe)} → {formatINR(preview.safe)} a day.
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

      {cancelled.length > 0 && (
        <div className="mt-4 border-t border-[var(--color-hairline)] pt-3">
          <h3 className="text-sm font-semibold">Cancelled</h3>
          <ul className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {cancelled.map((c) => (
              <li key={c.id} className="tnum flex justify-between py-1">
                <span>{c.label}</span>
                <span>saves {formatINR(c.amount)}/mo</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
