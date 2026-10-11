export interface Chip {
  label: string;
  amount: number;
}

export const CHIPS: Chip[] = [
  { label: "Headphones", amount: 1499 },
  { label: "Sneakers", amount: 2999 },
  { label: "Concert night", amount: 999 },
  { label: "Trip advance", amount: 5000 },
];

export interface Moment {
  tag: string;
  story: string;
  move: string;
}

export const MOMENTS: Moment[] = [
  {
    tag: "The 11pm order",
    story:
      "Food delivery, ₹640, day 9. It felt small at midnight. By morning it had quietly rewritten the next ten days.",
    move: "Saldo move: the daily number absorbs it overnight — no lecture, just a smaller figure with the reason attached.",
  },
  {
    tag: "The sale weekend",
    story:
      "Sneakers at 40% off, still ₹2,999 out the door. The discount is real; so is the Goa fund watching from day 30.",
    move: "Saldo move: simulate it first. If the goal date slips two days, you decide with both facts in hand.",
  },
  {
    tag: "The Goa fund",
    story: "₹1,200 saved of ₹4,500 with 19 days left. Close enough to protect, far enough to lose without noticing.",
    move: "Saldo move: every simulation shows the goal's finish day — on track, or the exact new date.",
  },
];

export const CASCADE: Array<[string, string]> = [
  ["Balance drops", "The rupee leaves, visibly."],
  ["Today's number recalculates", "The remaining days split what's left."],
  ["The goal date moves", "Goa in 8 days, or 10 — you see it shift."],
  ["The forecast bends", "The 30-day line redraws around the decision."],
  ["Steadiness shifts", "Four quiet parts, each showing its story."],
];

export const FORMULAS: Array<[string, string]> = [
  ["balance", "opening − spent"],
  ["bills ahead", "due day 12–30"],
  ["spendable", "balance − bills − ₹600 buffer"],
  ["safe today", "spendable ÷ 19 days, rounded down"],
  ["goal pace", "₹3,300 left ÷ 19 days"],
  ["forecast", "balance − bills − daily pace × days left"],
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "Is any of this real money?",
    a: "No. The demo runs on a fixed mock month — ₹10,000, 30 days, starting day 12. Nothing connects to a bank, nothing leaves your browser, nothing is saved.",
  },
  {
    q: "Do I need an account?",
    a: "There isn't one. Open the demo and it's already day 12 with spending history, upcoming bills, and a Goa fund waiting. State lives in memory and resets on reload.",
  },
  {
    q: "What if I blow past the safe amount?",
    a: "The number recalculates, the goal date slips to its new day, the forecast bends. No red warnings, no grades — just the consequence, stated plainly, with the days left to absorb it.",
  },
  {
    q: "What happens after day 30?",
    a: "Honestly: the demo ends there. A real version would close the month, carry the buffer forward, and start a fresh 30 days. That's the next thing to build.",
  },
];
