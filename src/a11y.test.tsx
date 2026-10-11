// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import Landing from "./features/landing/Landing";

afterEach(cleanup);

/**
 * Automated accessibility smoke tests. jsdom cannot evaluate color contrast
 * or real focus behavior, so these run alongside the manual keyboard,
 * contrast, and reduced-motion checks recorded in AUDIT.md — they are a
 * backstop against structural violations (missing names, bad ARIA), not the
 * whole story.
 */
describe("axe", () => {
  it("landing has no violations", async () => {
    const { container } = render(<Landing />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("demo has no violations", async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
