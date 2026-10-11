import type { RiskAssessment } from "./types";

export interface RiskInputs {
  spendable: number;
  safe: number;
  avg: number;
  forecast: number;
  bufferTarget: number;
  goalFinish: number;
  deadlineDay: number;
}

/**
 * Named financial risk with a plain-language reason — never color alone.
 *
 * Rules, checked in order:
 * - high: nothing left to split (`spendable <= 0`), or the month is projected
 *   to land under the safety buffer (`forecast < bufferTarget`).
 * - medium: the goal now finishes past its deadline, or today's pace runs
 *   hotter than the daily number (`avg > safe`), or the landing zone is thin
 *   (`forecast < 2 × buffer`).
 * - low: bills covered, buffer intact, goal on track.
 */
export function classifyRisk(inputs: RiskInputs): RiskAssessment {
  const { spendable, safe, avg, forecast, bufferTarget, goalFinish, deadlineDay } = inputs;

  if (spendable <= 0) {
    return {
      level: "high",
      reason: "Nothing left to split — bills and buffer already use the full balance.",
    };
  }
  if (forecast < bufferTarget) {
    return {
      level: "high",
      reason: "At this pace the month lands under the safety buffer.",
    };
  }
  if (goalFinish > deadlineDay) {
    return {
      level: "medium",
      reason: `The goal now finishes day ${goalFinish}, past its day-${deadlineDay} deadline.`,
    };
  }
  if (avg > safe) {
    return {
      level: "medium",
      reason: "Recent daily spending runs hotter than today's safe number.",
    };
  }
  if (forecast < bufferTarget * 2) {
    return {
      level: "medium",
      reason: "The landing zone is thin — under twice the safety buffer.",
    };
  }
  return {
    level: "low",
    reason: "Bills covered, buffer intact, goal on track.",
  };
}
