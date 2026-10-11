# Saldo — Know what a purchase costs before you buy

Saldo is a calm, single-page budget companion for a **₹10,000 / 30-day month**. It answers one
question before every purchase: *if I buy this, what exactly changes?* Simulate first, spend second.

- **Landing page** (`#`): interactive hero demo, real-life moments, the five-step cascade, open
  maths, and FAQ.
- **Live demo** (`#/app`): the full budget experience — safe-to-spend hero, simulation with
  Apply/Discard, goal tracking, 30-day forecast, and a four-part steadiness signal.
- **Mock data only.** No login, no backend, no real money. Everything lives in React memory and
  resets on reload.

---

## Contents

1. [Quick start](#1-quick-start)
2. [User guide](#2-user-guide)
3. [Worked example](#3-worked-example-the-1499-headphones)
4. [How the numbers work](#4-how-the-numbers-work)
5. [Accessibility](#5-accessibility)
6. [For developers](#6-for-developers)
7. [Testing](#7-testing)
8. [Deploying to production](#8-deploying-to-production)
9. [Scope and limitations](#9-scope-and-limitations)
10. [FAQ](#10-faq)

---

## 1. Quick start

**To explore (no setup):**

1. Run the app (see [For developers](#6-for-developers)) and open the landing page.
2. In the hero card, tap a sample purchase — **Headphones · ₹1,499** — and watch the daily number,
   goal date, and forecast move.
3. Click **Open the full demo** to enter the complete experience.

**To run locally:**

```bash
npm install
npm run dev      # development server with hot reload
npm run build    # type-check + production build into dist/
npm test         # unit tests (Vitest)
```

---

## 2. User guide

### The two numbers that matter

| Number | Where | Meaning |
|---|---|---|
| **Balance** | Hero, top | Cash in hand right now: opening balance minus everything spent. |
| **Safe to spend today** | Hero, large figure | What you can spend today and still cover upcoming bills, the safety buffer, and the rest of the month. |

Both live in an `aria-live` region, so screen readers announce every update.

### See the maths (tap the big number)

Click, tap, or press **Enter** on the safe-to-spend figure to open a breakdown sheet showing every line:
opening → spent → balance → bills ahead → buffer → spendable → divided over days left. Close it with
**Escape**, the **Close** button, or by clicking outside. Focus returns to the number automatically.

### Simulate before you spend

1. Fill in **what**, **amount (₹)**, and **day**; tick **monthly repeat** if it's a subscription
   (it will preview against commitments instead of spending).
2. Click **See preview**. A preview card shows exactly what would change — balance, safe-to-spend,
   goal finish day, and month-end forecast — plus one plain-language sentence about the impact.
3. Click **Apply** to commit it, or **Discard** to throw it away. Discarding changes nothing.

When you apply, the page updates in a fixed, visible order:

1. Balance drops.
2. Safe-to-spend recalculates.
3. The goal date moves (a new date appears if the goal slips past its deadline).
4. The 30-day forecast line bends.
5. The steadiness components shift.

If your system requests reduced motion, all five land instantly with no animation.

### Goals

The **Goa trip** card shows saved vs. target, the daily pace needed to hit the deadline, and the
projected finish day at today's safe amount. If a simulation pushes the finish past the deadline,
you see the exact new day and how many days late it is.

### Forecast

One SVG line (no chart library): actual balances for past days, then projected balances —
current balance minus upcoming bills minus your average daily pace — through day 30. During a
preview, a second dashed line shows where the month would end *with* the purchase.

### Steadiness score

A quiet 0–100 signal, deliberately not a grade. Four parts, each with its own bar; tap any part to
learn what would move it:

1. **Cash cushion** — balance relative to the ₹600 buffer.
2. **Bills ahead** — upcoming bills against balance (smaller is better).
3. **Goal pace** — savings progress measured against time passed.
4. **Spending rhythm** — even daily spending scores higher than one huge day between quiet ones.

### Keyboard map

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move through every control (visible focus ring throughout) |
| `Enter` / `Space` | Open the breakdown, toggle chips, expand score parts and FAQ |
| `Escape` | Close the breakdown sheet |

---

## 3. Worked example: the ₹1,499 headphones

Starting position on **day 12 of 30**: balance ₹8,830 · bills ahead ₹717 · spendable ₹7,513 ·
safe **₹395/day** · Goa fund finishing **day 20** · month ending near **₹6,092**.

Simulating **Headphones · ₹1,499** (one-off, day 12) previews:

| Figure | Before → After |
|---|---|
| Balance | ₹8,830 → ₹7,331 |
| Safe to spend | ₹395 → ₹316 |
| Goal finish | Day 20 → Day 22 |
| Month-end forecast | ≈ ₹6,092 → ≈ ₹4,593 |

The preview sentence reads: *"₹1,499 is about 3.8× today's safe amount of ₹395. Applied, each of the
19 remaining days averages ₹316."* Apply it, and the five updates cascade in order; discard it, and
every figure stays exactly as it was.

---

## 4. How the numbers work

Core formulas — implemented exactly in `src/lib/finance.ts`, each covered by unit tests in
`src/lib/finance.test.ts`:

| Formula | Seed value |
|---|---|
| `balance = openingBalance − sum(spent)` | ₹8,830 |
| `committedAhead = sum(commitments due day 12–30)` | ₹717 |
| `daysLeft = totalDays − currentDay + 1` | 19 |
| `spendable = max(0, balance − committedAhead − bufferTarget)` | ₹7,513 |
| `safeToSpendToday = floor(spendable / daysLeft)` | ₹395 |
| `goalPace = (target − saved) / max(1, deadlineDay − currentDay + 1)` | ₹173.68/day |
| `forecastEnd = balance − committedAhead − avgDailySpend × daysLeft` | ≈ ₹6,092 |
| `avgDailySpend = sum(spent) / (currentDay − 1)` | ₹106.36 over 11 elapsed days |

Derived figures and their documented assumptions:

- **Goal finish day** = `currentDay + ceil(remaining / max(1, safePerDay)) − 1`. Assumes you can set
  aside up to today's safe amount each day.
- **Health (0–100)** = average of cash cushion (`balance / 2×buffer`, capped), bills-ahead
  (`1 − committed/balance`), goal pace (progress vs. time elapsed), and spending rhythm (inverse of
  variation across days with spending; neutral 80 with fewer than two active days).
- **Recurring simulations** preview against `commitments`; one-offs against `spent`.

---

## 5. Accessibility

Committed to as requirements, not extras:

- **Semantics:** `<header>`, `<main>`, `<section>` with headings; real `<button>`s; every input has a
  `<label>`. Status pills pair color with text and an icon — never color alone.
- **Screen readers:** balance and safe-to-spend sit in `aria-live="polite"`; a visually-hidden live
  region announces a summary after every Apply/Discard. The forecast SVG has a title and description.
- **Dialog:** `role="dialog"` + `aria-modal` + accessible name, focus trap, Escape to close, and
  focus returned to the trigger.
- ** contrast:** body text meets WCAG AA 4.5:1, large text 3:1. Focus rings are always visible and
  never suppressed.
- **Motor and motion:** all touch targets ≥ 44×44px; `prefers-reduced-motion` collapses every
  animation (staggered cascade, swaps, scroll reveals) to instant updates.
- **Zoom and viewport:** fluid `clamp()` type and wrapping grids — no horizontal scrolling at 200%
  zoom; layouts hold at 375px, 768px, and 1280px.

---

## 6. For developers

**Stack:** React 19 + Vite 8 + TypeScript + Tailwind CSS v4. Self-hosted Inter Variable
(`@fontsource-variable/inter`). No chart library, no router, no runtime network requests.

```
src/
  lib/finance.ts        # pure formulas (the contract — change with care)
  lib/finance.test.ts   # 12 Vitest unit tests
  state/seed.ts         # the fixed mock month (day 12 of 30)
  hooks/useBudget.ts    # real state + simulation layer + staggered reveal
  components/           # BreakdownDialog, Simulator, ForecastChart, HealthScore
  landing/Landing.tsx   # landing page (interactive hero, moments, FAQ)
  App.tsx               # the demo (route #/app)
  main.tsx              # hash router: # landing, #/app demo
```

**Key architecture decisions:**

- **Simulation is a layer, not a mutation.** `preview` derives figures from `real state + draft`
  without touching state; Apply commits the draft into `spent` or `commitments`, Discard drops it.
- **Derived data is memoized** (`useMemo`) so typing in the form never re-renders the whole tree.
- **The stagger is ordered state, not choreography magic:** `hotStage` 1→5 highlights balance,
  safe, goal, forecast, health in sequence (300ms steps), then clears.
- **Hash routing** keeps the bundle router-free: `#` vs. `#/app`. In-page anchors (`#maths`, `#faq`)
  intentionally bypass scroll-reset so native section scrolling works under the sticky header.

**Visual system:** warm near-white `#FAFAF7`, near-black ink, one accent (`#0A5CF5`) used sparingly,
muted green/amber status with icon + text, 20px card radius, hairline dividers, no gradients, no
emoji. Motion is 200–400ms ease-out, transform/opacity only. (Taste-skill direction applied; its
anti-Inter default was overridden by the brief's explicit Inter requirement.)

---

## 7. Testing

```bash
npm test          # single run
npm run test:watch
```

`src/lib/finance.test.ts` pins every formula to the seed scenario (balance ₹8,830, safe ₹395, pace
₹173.68…), plus edge cases (zero days left, empty history, pre-today commitments excluded), the
exact ₹1,499 simulation delta, health bounds, and goal-date movement. Manual checklist before
release: fresh load with zero console output → open/Escape the breakdown → preview → apply (verify
the 1-2-3-4-5 order) → discard (verify nothing changed) → full keyboard pass → 375/768/1280px.

---

## 8. Deploying to production

```bash
npm run build   # emits static files into dist/
```

Serve `dist/` from any static host (Netlify, Vercel, GitHub Pages, nginx). No environment variables,
no server, no runtime fetches — if the host serves `index.html` at `/`, the `#/app` route works
automatically since it's hash-based. Current production bundle: ~80KB gzipped JS (React included),
~8KB CSS, self-hosted fonts.

---

## 9. Scope and limitations

- One fixed mock month (days 1–30, today = day 12). Reloading resets everything.
- One goal (Goa trip). No editing of history, no categories, no multi-month view.
- Goal projection assumes up to today's safe amount can be set aside daily — a simplification,
  stated in the UI as "around day N".
- Health is a descriptive signal, not financial advice.

---

## 10. FAQ

**Is any of this real money?**
No. Fixed mock data, nothing connects to a bank, nothing leaves your browser.

**Do I need an account?**
There isn't one. Open the demo and it's already day 12.

**What if I overshoot the safe amount?**
The number recalculates, the goal date slips to its new day, the forecast bends. Stated plainly —
no warnings, no grades.

**What happens after day 30?**
The demo ends there. A real version would close the month, carry the buffer forward, and start a
fresh 30 days.
