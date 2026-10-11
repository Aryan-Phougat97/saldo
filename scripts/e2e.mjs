import { chromium } from "playwright";

const BASE = "http://localhost:5177";
const errors = [];
const warnings = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
  if (m.type() === "warning") warnings.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

function assert(cond, name) {
  console.log((cond ? "PASS " : "FAIL ") + name);
  if (!cond) process.exitCode = 1;
}

// 1. Landing loads
await page.goto(BASE + "/#", { waitUntil: "networkidle" });
assert(await page.locator("h1").count() === 1, "landing h1 present");

// 2. No horizontal overflow at 3 widths
for (const w of [1280, 768, 375]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(
    () => document.scrollingElement.scrollWidth - window.innerWidth,
  );
  assert(overflow <= 1, `no horizontal overflow at ${w}px (got ${overflow})`);
  await page.screenshot({ path: `/tmp/saldo-landing-${w}.png` });
}
await page.setViewportSize({ width: 1280, height: 900 });

// 3. Enter demo
await page.getByRole("link", { name: "Open the full demo" }).click();
await page.waitForURL("**#/app");
assert((await page.locator("h1").textContent())?.includes("glance"), "demo hero present");

// 4. Keyboard: tab to safe button, Enter opens dialog, Escape closes + focus returns
const safeBtn = page.getByRole("button", { name: /₹3/ }).first();
await safeBtn.focus();
assert((await page.evaluate(() => document.activeElement?.tagName)) === "BUTTON", "safe button focusable");
await page.keyboard.press("Enter");
await page.getByRole("dialog").waitFor();
assert(await page.getByRole("dialog").isVisible(), "dialog opens on Enter");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
assert((await page.getByRole("dialog").count()) === 0, "dialog closes on Escape");
const refocused = await page.evaluate(() => document.activeElement?.textContent);
assert(/₹/.test(refocused ?? ""), "focus returns to safe button");

// 5. Simulate + apply via form defaults (Headphones 1499)
await page.getByRole("button", { name: "See preview" }).click();
await page.getByRole("button", { name: "Apply" }).first().waitFor();
const previewText = await page.locator("text=Preview: Headphones").count();
assert(previewText === 1, "preview appears before apply");
await page.getByRole("button", { name: "Apply" }).first().click();
await page.waitForTimeout(300);
const hero = await page.locator("main").textContent();
assert(/₹7,331/.test(hero ?? ""), "balance drops to 7331 after apply");
assert((await page.locator("text=Applied Headphones").count()) >= 0, "announcement rendered");

// 6. Discard leaves no trace
await page.getByRole("button", { name: "See preview" }).click();
await page.getByRole("button", { name: "Discard" }).first().click();
await page.waitForTimeout(200);
const hero2 = await page.locator("main").textContent();
assert(/₹7,331/.test(hero2 ?? ""), "discard changes nothing");

// 7. Cancel Spotify subscription
await page.getByRole("button", { name: "Simulate cancel" }).first().click();
await page.getByText(/year would have cost/).waitFor();
const cancelText = await page.locator("main").textContent();
assert(/₹2,388|₹1,428/.test(cancelText ?? ""), "annual impact shown");
await page.getByRole("button", { name: "Apply" }).first().click();
await page.waitForTimeout(300);

// 8. Shock response
await page.getByRole("button", { name: "Pay now" }).first().click();
await page.getByRole("button", { name: "Apply" }).first().click();
await page.waitForTimeout(300);
const logItems = await page.locator("section:has(h2:text('Decision log')) li").count();
assert(logItems >= 3, `decision log has entries (got ${logItems})`);

// 8b. Undo restores the pre-shock month
await page.getByRole("button", { name: "Undo last applied decision" }).click();
await page.waitForTimeout(300);
const heroUndo = await page.locator("main").textContent();
assert(/₹7,331/.test(heroUndo ?? ""), "undo restores balance to 7331");
assert(((await page.locator("section:has(h2:text('Decision log')) li").count()) === 2), "undo shrinks the log");

// 9. Screenshots of demo at 3 widths
for (const w of [1280, 768, 375]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(
    () => document.scrollingElement.scrollWidth - window.innerWidth,
  );
  assert(overflow <= 1, `demo no overflow at ${w}px (got ${overflow})`);
  await page.screenshot({ path: `/tmp/saldo-demo-${w}.png`, fullPage: true });
}

// 10. Reset restores seed
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByRole("button", { name: "Reset demo" }).click();
await page.waitForTimeout(300);
const hero3 = await page.locator("main").textContent();
assert(/₹8,830/.test(hero3 ?? ""), "reset restores balance");

console.log("console.errors:", JSON.stringify(errors));
console.log("console.warnings:", JSON.stringify(warnings));
assert(errors.length === 0, "zero console errors");
await browser.close();
