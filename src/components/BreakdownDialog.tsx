import { useEffect, useRef } from "react";
import { formatINR } from "../lib/format";
import { calcOpening } from "../domain/formulas";
import type { Budget } from "../state/store";

interface Props {
  budget: Budget;
  open: boolean;
  onClose: () => void;
  returnRef: React.RefObject<HTMLButtonElement | null>;
}

export default function BreakdownDialog({ budget, open, onClose, returnRef }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { real, spent, commitments, income, openingBase, openingBalance, bufferTarget, currentDay, totalDays } = budget;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const trigger = returnRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      trigger?.focus();
    };
  }, [open, onClose, returnRef]);

  if (!open) return null;

  const rows: Array<[string, string]> = [
    ["Starting cash", formatINR(openingBase)],
    ...income.map(
      (i): [string, string] => [`${i.label} (day ${i.day})`, "+ " + formatINR(i.amount)],
    ),
    ["Opening balance", formatINR(calcOpening(openingBase, income, currentDay))],
    [`Spent so far (${spent.length} items)`, "− " + formatINR(openingBalance - real.balance)],
    ["Balance now", formatINR(real.balance)],
    ["Committed ahead (day " + currentDay + "–" + totalDays + ")", "− " + formatINR(real.committedAhead)],
    ["Safety buffer", "− " + formatINR(bufferTarget)],
    ["Spendable", formatINR(real.spendable)],
    [`Divided over ${real.daysLeft} days left`, "÷ " + real.daysLeft],
    ["Safe to spend today", formatINR(real.safe)],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="breakdown-title"
        className="card w-full max-w-md p-6"
      >
        <div className="mb-1 flex items-start justify-between gap-4">
          <h2 id="breakdown-title" className="text-xl font-semibold tracking-tight">
            How safe-to-spend is calculated
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close breakdown"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--color-hairline)] px-3 text-sm font-medium"
          >
            Close
          </button>
        </div>
        <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
          Day {currentDay} of {totalDays}. Every line uses your real numbers.
        </p>
        <ol className="divide-y divide-[var(--color-hairline)]">
          {rows.map(([label, value], i) => {
            const isResult = i === rows.length - 1;
            return (
              <li key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className={isResult ? "text-base font-semibold" : "text-sm text-[var(--color-ink-soft)]"}>
                  <span className="tnum mr-2 text-[var(--color-ink-faint)]">{i + 1}.</span>
                  {label}
                </span>
                <span className={isResult ? "tnum text-lg font-semibold" : "tnum text-sm font-medium"}>{value}</span>
              </li>
            );
          })}
        </ol>
        <h3 className="mt-4 text-sm font-semibold">Spent so far</h3>
        <ul className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {spent.map((s) => (
            <li key={s.id} className="flex justify-between py-1">
              <span>{s.label} · day {s.day}</span>
              <span className="tnum">{formatINR(s.amount)}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-3 text-sm font-semibold">Committed ahead</h3>
        <ul className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {commitments
            .filter((c) => c.day >= currentDay)
            .map((c) => (
              <li key={c.id} className="flex justify-between py-1">
                <span>{c.label} · day {c.day}</span>
                <span className="tnum">{formatINR(c.amount)}</span>
              </li>
            ))}
        </ul>
        <p className="tnum mt-4 border-t border-[var(--color-hairline)] pt-3 text-sm text-[var(--color-ink-soft)]">
          Reconciled: {formatINR(openingBalance)} − {formatINR(openingBalance - real.balance)} spent −{" "}
          {formatINR(real.committedAhead)} bills = {formatINR(real.spendable)} free +{" "}
          {formatINR(bufferTarget)} buffer.
        </p>
      </div>
    </div>
  );
}
