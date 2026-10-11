import { describe, expect, it } from "vitest";
import {
  calcAvgDailySpend,
  calcBalance,
  calcCommittedAhead,
  calcDaysLeft,
  calcForecastEnd,
  calcGoalFinishDay,
  calcGoalPace,
  calcOpening,
  calcSafeToSpend,
  calcSpendable,
  sumSpent,
} from "./formulas";
import { calcHealth } from "./health";
import { seed } from "../data/seed";

describe("core formulas (seed: day 12 of 30, ₹10,000 budget)", () => {
  it("balance = openingBalance - sum(spent)", () => {
    // 640 + 210 + 320 = 1170
    expect(calcBalance(seed.openingBalance, seed.spent)).toBe(8830);
  });

  it("committedAhead sums commitments due on/after currentDay within window", () => {
    // Spotify 119 (day 12) + phone 399 (15) + Netflix 199 (18) = 717
    expect(calcCommittedAhead(seed.commitments, seed.currentDay, seed.totalDays)).toBe(717);
    // commitments before today are excluded
    expect(
      calcCommittedAhead(
        [...seed.commitments, { id: "x", label: "Old", amount: 500, day: 5 }],
        seed.currentDay,
        seed.totalDays,
      ),
    ).toBe(717);
  });

  it("daysLeft = totalDays - currentDay + 1", () => {
    expect(calcDaysLeft(30, 12)).toBe(19);
    expect(calcDaysLeft(30, 30)).toBe(1);
    expect(calcDaysLeft(30, 31)).toBe(0);
  });

  it("spendable = max(0, balance - committedAhead - buffer)", () => {
    expect(calcSpendable(8830, 717, 600)).toBe(7513);
    expect(calcSpendable(500, 400, 600)).toBe(0);
  });

  it("safeToSpendToday = floor(spendable / daysLeft)", () => {
    expect(calcSafeToSpend(7513, 19)).toBe(395);
    expect(calcSafeToSpend(100, 0)).toBe(0);
  });

  it("goalPace = remaining / max(1, deadlineDay - currentDay + 1)", () => {
    // (4500 - 1200) / 19 = 173.68…
    expect(calcGoalPace(seed.goals[0], 12)).toBeCloseTo(173.684, 2);
  });

  it("avgDailySpend averages past spend across elapsed days", () => {
    // 1170 / 11 elapsed days = 106.36…
    expect(calcAvgDailySpend(seed.spent, 12)).toBeCloseTo(106.3636, 2);
    expect(calcAvgDailySpend([], 1)).toBe(0);
  });

  it("forecastEndBalance = balance - committedAhead - avgDailySpend * daysLeft", () => {
    const avg = 1170 / 11;
    expect(calcForecastEnd(8830, 717, avg, 19)).toBeCloseTo(8830 - 717 - avg * 19, 6);
  });

  it("a ₹1,499 simulation lowers safe-to-spend exactly", () => {
    const simBalance = calcBalance(seed.openingBalance, [
      ...seed.spent,
      { id: "sim", label: "Headphones", amount: 1499, day: 12 },
    ]);
    expect(simBalance).toBe(7331);
    const spendable = calcSpendable(simBalance, 717, 600);
    expect(calcSafeToSpend(spendable, 19)).toBe(Math.floor((7331 - 717 - 600) / 19));
  });
});

describe("edge cases", () => {
  it("opening adds base cash to income received so far", () => {
    expect(calcOpening(6000, seed.income, 12)).toBe(10000);
    // Income arriving after today does not count yet.
    expect(
      calcOpening(6000, [...seed.income, { id: "i2", label: "Later", amount: 500, day: 20 }], 12),
    ).toBe(10000);
  });

  it("sumSpent totals the seed's three spends", () => {
    expect(sumSpent(seed.spent)).toBe(1170);
    expect(sumSpent([])).toBe(0);
  });
  it("zero balance clamps spendable and safe to zero", () => {
    const balance = calcBalance(1000, [{ id: "a", label: "All of it", amount: 1000, day: 1 }]);
    expect(balance).toBe(0);
    expect(calcSpendable(balance, 0, 600)).toBe(0);
    expect(calcSafeToSpend(0, 19)).toBe(0);
  });

  it("a commitment past the 30-day window is ignored", () => {
    expect(
      calcCommittedAhead([{ id: "f", label: "Future", amount: 9999, day: 31 }], 12, 30),
    ).toBe(0);
  });

  it("a commitment due on the current day counts", () => {
    expect(
      calcCommittedAhead([{ id: "t", label: "Today", amount: 119, day: 12 }], 12, 30),
    ).toBe(119);
  });

  it("negative spendable clamps to zero", () => {
    expect(calcSpendable(-200, 100, 600)).toBe(0);
    expect(calcSpendable(500, 2000, 0)).toBe(0);
  });

  it("a finished goal finishes today with no daily pace", () => {
    const done = { id: "g", label: "Done", target: 1000, saved: 1000, deadlineDay: 30 };
    expect(calcGoalFinishDay(done, 12, 395)).toBe(12);
    expect(calcGoalPace(done, 12)).toBe(0);
  });

  it("an unreachable goal projects past its deadline", () => {
    const big = { id: "g", label: "Far", target: 50000, saved: 0, deadlineDay: 30 };
    expect(calcGoalFinishDay(big, 12, 395)).toBeGreaterThan(30);
  });

  it("health at zero balance scores commitment 0 without NaN", () => {
    const h = calcHealth(0, 717, 600, seed.goals[0], seed.spent, 12, 30);
    expect(h.commitment).toBe(0);
    expect(Number.isNaN(h.overall)).toBe(false);
  });
});

describe("health + goal projection", () => {
  it("health parts stay within 0..100", () => {
    const h = calcHealth(8830, 717, 600, seed.goals[0], seed.spent, 12, 30);
    for (const v of [h.liquidity, h.commitment, h.goal, h.steadiness, h.overall]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(h.overall).toBe(Math.round((h.liquidity + h.commitment + h.goal + h.steadiness) / 4));
  });

  it("lower commitment ratio scores higher", () => {
    const a = calcHealth(8830, 717, 600, seed.goals[0], seed.spent, 12, 30);
    const b = calcHealth(8830, 4000, 600, seed.goals[0], seed.spent, 12, 30);
    expect(a.commitment).toBeGreaterThan(b.commitment);
  });

  it("goal finish day moves later when safe-to-spend drops", () => {
    const early = calcGoalFinishDay(seed.goals[0], 12, 395);
    const late = calcGoalFinishDay(seed.goals[0], 12, 316);
    expect(late).toBeGreaterThan(early);
  });
});
