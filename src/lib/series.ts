import type { Commitment, Spent } from "../domain/types";

export interface SeriesInput {
  spent: Spent[];
  commitments: Commitment[];
  openingBalance: number;
  balance: number;
  avg: number;
  currentDay: number;
  totalDays: number;
}

/**
 * Day-by-day projected balance for the whole month, shared by the forecast
 * chart and the landing-page sparkline. Past days show actuals
 * (opening − cumulative spend); from today on, each point subtracts the bills
 * due up to that day plus pace × days elapsed.
 */
export function buildForecastSeries(input: SeriesInput): number[] {
  const { spent, commitments, openingBalance, balance, avg, currentDay, totalDays } = input;
  const cumSpent: number[] = new Array(totalDays + 1).fill(0);
  for (const s of spent) {
    for (let d = s.day; d <= totalDays; d++) cumSpent[d] += s.amount;
  }
  const cumCommit: number[] = new Array(totalDays + 1).fill(0);
  for (const c of commitments) {
    for (let d = c.day; d <= totalDays; d++) cumCommit[d] += c.amount;
  }
  const line: number[] = [];
  for (let d = 1; d <= totalDays; d++) {
    if (d < currentDay) {
      line.push(openingBalance - cumSpent[d]);
    } else {
      line.push(
        balance - (cumCommit[d] - cumCommit[currentDay - 1]) - avg * (d - currentDay + 1),
      );
    }
  }
  return line;
}

/**
 * Convert a value series into an SVG path string. Min/max are padded with 0
 * and 1 so a flat or empty series still renders a visible line.
 */
export function linePath(values: number[], width: number, height: number, pad: number): string {
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2);
      const y = height - pad - ((v - min) / span) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
