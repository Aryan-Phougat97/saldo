import { memo, useMemo } from "react";
import { seed } from "../../data/seed";

/**
 * One cell per month day: dark = spent, outlined = bill due, ring = today.
 * Decorative grid (aria-hidden) with a screen-reader summary plus a
 * shape-and-text legend — state is never carried by color alone.
 */
function MonthStrip() {
  const spentDays = useMemo(() => new Set(seed.spent.map((s) => s.day)), []);
  const billDays = useMemo(() => new Set(seed.commitments.map((c) => c.day)), []);
  const cells = useMemo(() => Array.from({ length: seed.totalDays }, (_, i) => i + 1), []);

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
        Spent on days {[...spentDays].join(", ")}. Bills due on days {[...billDays].join(", ")}.
        Today is day {seed.currentDay}. Goal deadline day {seed.goals[0].deadlineDay}.
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

// Static month grid — memo keeps chip taps from re-rendering it.
export default memo(MonthStrip);
