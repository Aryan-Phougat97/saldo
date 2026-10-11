import type { Commitment, Goal, Spent } from "../lib/finance";

export interface Seed {
  budgetTotal: number;
  currentDay: number;
  totalDays: number;
  openingBalance: number;
  spent: Spent[];
  commitments: Commitment[];
  goals: Goal[];
  bufferTarget: number;
  subscriptions: string[];
}

export const seed: Seed = {
  budgetTotal: 10000,
  currentDay: 12,
  totalDays: 30,
  openingBalance: 10000,
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
};
