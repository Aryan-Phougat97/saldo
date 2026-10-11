// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Simulator from "./Simulator";
import { useBudgetStore } from "../state/store";
import type { Budget } from "../state/store";

(globalThis as unknown as Record<string, boolean>).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup);

function renderSimulator() {
  let budget!: Budget;
  function Harness() {
    budget = useBudgetStore();
    return <Simulator budget={budget} />;
  }
  const utils = render(<Harness />);
  return { ...utils, getBudget: () => budget };
}

describe("Simulator validation", () => {
  it("rejects an empty name inline", () => {
    renderSimulator();
    fireEvent.change(screen.getByLabelText("What is it?"), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "See preview" }));
    expect(screen.getByRole("alert").textContent).toMatch(/a name/);
  });

  it("rejects zero and negative amounts inline", () => {
    renderSimulator();
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "-5" } });
    fireEvent.click(screen.getByRole("button", { name: "See preview" }));
    expect(screen.getByRole("alert").textContent).toMatch(/above ₹0/);
  });

  it("rejects amounts above the cap inline", () => {
    renderSimulator();
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "500000" } });
    fireEvent.click(screen.getByRole("button", { name: "See preview" }));
    expect(screen.getByRole("alert").textContent).toMatch(/1,00,000/);
  });

  it("shows a preview with risk and health rows, then applies", () => {
    const { getBudget } = renderSimulator();
    fireEvent.click(screen.getByRole("button", { name: "See preview" }));
    expect(screen.getByText(/Preview: Headphones/).textContent).toMatch(/₹1,499/);
    expect(screen.getByText("Risk").parentElement?.textContent).toMatch(/low/);
    expect(screen.getByText("Steadiness").parentElement?.textContent).toMatch(/\/ 100/);
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(getBudget().log).toHaveLength(1);
  });

  it("discard leaves the log empty", () => {
    const { getBudget } = renderSimulator();
    fireEvent.click(screen.getByRole("button", { name: "See preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(getBudget().log).toHaveLength(0);
    expect(screen.queryByText(/Preview: Headphones/)).toBeNull();
  });
});
