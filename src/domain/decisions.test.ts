import { describe, expect, it } from "vitest";
import {
  cancellationImpact,
  describeShockResponse,
  MAX_SIM_AMOUNT,
  parseAmount,
} from "./decisions";

describe("parseAmount", () => {
  it("accepts positive numbers and rounds", () => {
    expect(parseAmount("1499")).toEqual({ ok: true, value: 1499 });
    expect(parseAmount("99.6")).toEqual({ ok: true, value: 100 });
  });

  it("rejects empty, non-numeric, zero, and negative input with one message", () => {
    for (const bad of ["", "   ", "abc", "0", "-50"]) {
      const r = parseAmount(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/above ₹0/);
    }
  });

  it("rejects amounts above the cap", () => {
    const r = parseAmount(String(MAX_SIM_AMOUNT + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/1,00,000/);
    expect(parseAmount(String(MAX_SIM_AMOUNT)).ok).toBe(true);
  });
});

describe("cancellationImpact", () => {
  it("reports monthly savings and the yearly cost avoided", () => {
    expect(cancellationImpact(199)).toEqual({ monthly: 199, annual: 2388 });
    expect(cancellationImpact(0)).toEqual({ monthly: 0, annual: 0 });
  });
});

describe("describeShockResponse", () => {
  const shock = { id: "h", label: "Repair", amount: 2200, day: 12, note: "" };
  it("states the full amount for pay-now", () => {
    expect(describeShockResponse(shock, "pay-now")).toMatch(/₹2,200.*today/);
  });
  it("states the split halves honestly", () => {
    expect(describeShockResponse({ ...shock, amount: 481 }, "split")).toMatch(/₹241/);
  });
  it("states that defer moves everything by 7 days", () => {
    expect(describeShockResponse(shock, "defer")).toMatch(/Nothing leaves today/);
  });
});
