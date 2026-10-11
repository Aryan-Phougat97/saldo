import { useMemo } from "react";
import { formatINR } from "../lib/format";
import { buildForecastSeries, linePath } from "../lib/series";
import type { Budget } from "../state/store";

export default function ForecastChart({ budget, hot }: { budget: Budget; hot: boolean }) {
  const { spent, commitments, real, preview, currentDay, totalDays, openingBalance } = budget;

  const series = useMemo(() => {
    const base = buildForecastSeries({
      spent,
      commitments,
      openingBalance,
      balance: real.balance,
      avg: real.avg,
      currentDay,
      totalDays,
    });
    let sim: number[] | null = null;
    if (preview) {
      const drop = real.balance - preview.balance;
      const commitShift = preview.committedAhead - real.committedAhead;
      sim = base.map((v, i) => (i + 1 < currentDay ? v : v - drop - commitShift));
    }
    return { base, sim };
  }, [spent, commitments, real, preview, currentDay, totalDays, openingBalance]);

  const W = 560;
  const H = 180;
  const d = linePath(series.base, W, H, 12);

  return (
    <section aria-labelledby="forecast-title" className={`card pulse-stage p-6 ${hot ? "is-hot" : ""}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="forecast-title" className="text-xl font-semibold tracking-tight">
          30-day forecast
        </h2>
        <p className="tnum text-sm font-medium">Ends {formatINR((preview ?? real).forecast)}</p>
      </div>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Past spending pace plus upcoming bills, day by day.
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="forecast-svg-title forecast-svg-desc"
        className="mt-3 w-full"
      >
        <title id="forecast-svg-title">Projected balance over 30 days</title>
        <desc id="forecast-svg-desc">
          Balance starts at {formatINR(openingBalance)} and is projected to end at{" "}
          {formatINR((preview ?? real).forecast)}.
        </desc>
        <line x1={12} y1={H - 12} x2={W - 12} y2={H - 12} stroke="#e7e7e1" strokeWidth={1} />
        <line
          x1={12 + ((currentDay - 1) / Math.max(1, totalDays - 1)) * (W - 24)}
          y1={8}
          x2={12 + ((currentDay - 1) / Math.max(1, totalDays - 1)) * (W - 24)}
          y2={H - 8}
          stroke="#0a5cf5"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <path d={d} fill="none" stroke="#1c1c1a" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {series.sim && (
          <path
            d={linePath(series.sim, W, H, 12)}
            fill="none"
            stroke="#0a5cf5"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="mt-1 flex items-center gap-4 text-sm text-[var(--color-ink-soft)]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0.5 w-5 bg-[#1c1c1a]" /> Current path
        </span>
        {series.sim && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-5 bg-[var(--color-accent)]" /> With preview
          </span>
        )}
        <span className="ml-auto">Today: day {currentDay}</span>
      </div>
    </section>
  );
}
