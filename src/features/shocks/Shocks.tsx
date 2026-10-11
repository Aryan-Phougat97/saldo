import { formatINR } from "../../lib/format";
import { describeShockResponse } from "../../domain/decisions";
import type { ShockResponse } from "../../domain/types";
import type { Budget } from "../../state/store";

const RESPONSES: Array<{ id: ShockResponse; label: string }> = [
  { id: "pay-now", label: "Pay now" },
  { id: "split", label: "Split over 7 days" },
  { id: "defer", label: "Defer 7 days" },
];

function responseLabel(response: ShockResponse): string {
  if (response === "pay-now") return "pay now";
  if (response === "split") return "split over 7 days";
  return "defer 7 days";
}

/**
 * Unexpected expenses as their own category. Each shock is answered once —
 * pay now, split, or defer — and every answer previews its effect first.
 */
export default function Shocks({ budget }: { budget: Budget }) {
  const { shocks, usedShocks, simulation, simulate, apply, discard, real, preview } = budget;
  const open = shocks.filter((s) => !usedShocks.includes(s.id));
  const done = shocks.filter((s) => usedShocks.includes(s.id));

  const shockDraft = simulation && simulation.kind === "shock" ? simulation : null;
  const shockTarget = shockDraft ? shocks.find((s) => s.id === shockDraft.shockId) ?? null : null;

  return (
    <section aria-labelledby="shocks-title" className="card p-6">
      <h2 id="shocks-title" className="text-xl font-semibold tracking-tight">
        Unexpected expenses
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Life invoices. Pick a response to see what it does before it lands.
      </p>

      {open.length === 0 && (
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Quiet on this front — every surprise so far has an answer.
        </p>
      )}

      <ul className="mt-3 grid gap-3">
        {open.map((s) => (
          <li key={s.id} className="rounded-2xl border border-[var(--color-hairline)] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="tnum text-sm font-medium">{formatINR(s.amount)}</p>
            </div>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{s.note}</p>
            <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label={`Respond to ${s.label}`}>
              {RESPONSES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => simulate({ kind: "shock", shockId: s.id, response: r.id })}
                  className="min-h-[44px] rounded-xl border border-[var(--color-hairline)] bg-white px-3 text-sm font-medium active:scale-[0.98]"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {shockDraft && shockTarget && preview && (
        <div aria-live="polite" className="mt-3 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4 text-sm">
          <p className="font-semibold">
            Preview: {shockTarget.label} — {responseLabel(shockDraft.response)}
          </p>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            {describeShockResponse(shockTarget, shockDraft.response)}
          </p>
          <p className="tnum mt-1">
            Balance {formatINR(real.balance)} → {formatINR(preview.balance)} · safe{" "}
            {formatINR(real.safe)} → {formatINR(preview.safe)} · risk {real.risk.level} →{" "}
            {preview.risk.level}
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

      {done.length > 0 && (
        <p className="mt-3 text-sm text-[var(--color-ink-faint)]">
          Handled: {done.map((s) => s.label).join(" · ")}.
        </p>
      )}
    </section>
  );
}
