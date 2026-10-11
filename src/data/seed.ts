import type { Commitment, Goal, Income, ShockEvent, Spent } from "../domain/types";

/**
 * The fixed mock month behind the whole demo.
 *
 * Scenario: a ₹10,000 budget for 30 days. Today is day 12. The opening
 * ₹10,000 = ₹6,000 starting cash + a ₹4,000 freelance payout received on
 * day 5 (income is shown, not hidden). Three everyday spends are behind us,
 * three bills (two of them subscriptions) sit ahead, the Goa trip fund is
 * ₹1,200 of ₹4,500 with a day-30 deadline, and three unexpected expenses are
 * waiting for the user's response.
 */
export interface Seed {
  budgetTotal: number;
  currentDay: number;
  totalDays: number;
  /** Starting cash before any income arrived. */
  openingBase: number;
  /** openingBase + income received so far. The balance formula uses this. */
  openingBalance: number;
  income: Income[];
  spent: Spent[];
  commitments: Commitment[];
  goals: Goal[];
  bufferTarget: number;
  subscriptions: string[];
  shocks: ShockEvent[];
}

export const seed: Seed = {
  budgetTotal: 10000,
  currentDay: 12,
  totalDays: 30,
  openingBase: 6000,
  openingBalance: 10000,
  income: [{ id: "i1", label: "Freelance illustration payout", amount: 4000, day: 5 }],
  spent: [
    { id: "s1", label: "Food delivery", amount: 640, day: 9 },
    { id: "s2", label: "Cab", amount: 210, day: 10 },
    { id: "s3", label: "Coffee + snacks", amount: 320, day: 11 },
  ],
  commitments: [
    { id: "c1", label: "Spotify", amount: 119, day: 12, recurring: "monthly" },
    { id: "c2", label: "Phone bill", amount: 399, day: 15 },
    { id: "c3", label: "Netflix", amount: 199, day: 18, recurring: "monthly" },
  ],
  goals: [{ id: "g1", label: "Goa trip", target: 4500, saved: 1200, deadlineDay: 30 }],
  bufferTarget: 600,
  subscriptions: ["Spotify", "Netflix"],
  shocks: [
    {
      id: "h1",
      label: "Phone screen repair",
      amount: 2200,
      day: 12,
      note: "Cracked display. The shop quotes ₹2,200 to fix it today.",
    },
    {
      id: "h2",
      label: "Surge-priced cab",
      amount: 480,
      day: 12,
      note: "Rain + rush hour. The ride home costs more than twice the usual.",
    },
    {
      id: "h3",
      label: "Dentist visit",
      amount: 1500,
      day: 13,
      note: "A filling that can't wait past this week.",
    },
  ],
};
