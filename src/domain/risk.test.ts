import { describe, expect, it } from "vitest";
import { classifyRisk } from "./risk";

const BASE = {
  spendable: 7513,
  safe: 395,
  avg: 106,
  forecast: 6092,
  bufferTarget: 600,
  goalFinish: 20,
  deadlineDay: 30,
};

describe("classifyRisk", () => {
  it("is low when bills are covered, buffer intact, goal on track", () => {
    const r = classifyRisk(BASE);
    expect(r.level).toBe("low");
    expect(r.reason.length).toBeGreaterThan(0);
  });

  it("is high when nothing is left to split", () => {
    expect(classifyRisk({ ...BASE, spendable: 0 }).level).toBe("high");
  });

  it("is high when the forecast lands under the buffer", () => {
    const r = classifyRisk({ ...BASE, forecast: 400 });
    expect(r.level).toBe("high");
    expect(r.reason).toMatch(/buffer/);
  });

  it("is medium when the goal slips past its deadline", () => {
    const r = classifyRisk({ ...BASE, goalFinish: 34 });
    expect(r.level).toBe("medium");
    expect(r.reason).toMatch(/34/);
  });

  it("is medium when the pace runs hotter than the daily number", () => {
    expect(classifyRisk({ ...BASE, avg: 500 }).level).toBe("medium");
  });

  it("is medium when the landing zone is thin", () => {
    expect(classifyRisk({ ...BASE, forecast: 1000 }).level).toBe("medium");
  });
});
