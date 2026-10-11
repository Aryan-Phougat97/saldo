# Saldo — Know what a purchase costs before you buy

Saldo is a calm, single-page budget companion for a **₹10,000 / 30-day month**, built for Gen Z
users learning to feel the weight of a decision *before* it lands. It answers one question before
every purchase: *if I buy this, what exactly changes?* Simulate first, spend second.

- **Landing page** (`#`): interactive hero demo, real-life moments, the five-step cascade, open
  maths, and FAQ.
- **Live demo** (`#/app`): safe-to-spend hero with income + reconciliation, purchase/subscribe/
  cancel/shock/goal-transfer simulation with Apply/Discard, goal tracking, 30-day forecast, named
  risk, four-part steadiness, subscriptions, shock responses, and a decision log.
- **Mock data only.** No login, no backend, no real money. Everything lives in React memory and
  resets on reload (or via Reset demo).

Hash routes: `#` landing page, `#/app` the budget demo.

---

## Contents

1. [Quick start](#1-quick-start)
2. [User guide](#2-user-guide)
3. [Worked example](#3-worked-example-the-1499-headphones)
4. [How the numbers work](#4-how-the-numbers-work)
5. [The simulation model](#5-the-simulation-model)
6. [The health score](#6-the-health-score)
7. [Accessibility decisions](#7-accessibility-decisions)
8. [Performance decisions](#8-performance-decisions)
9. [For developers](#9-for-developers)
10. [Testing](#10-testing)
11. [Deploying to production](#11-deploying-to-production)
12. [Scope and limitations](#12-scope-and-limitations)
13. [How the app maps to the brief](#13-how-the-app-maps-to-the-brief)
14. [FAQ](#14-faq)

---

## 1. Quick start

**To explore (no setup):** open the landing page, tap a sample purchase in the hero, then
**Open the full demo**.

**To run locally:**

```bash
npm install
npm run dev        # development server with hot reload
npm run build      # type-check + production build into dist/
npm test           # unit + axe tests (Vitest)
npm run lint       # ESLint, zero warnings allowed
npm run typecheck  # tsc --noEmit, zero errors allowed
npx knip           # dead files, deps, and exports — must report none
```

---

## 2. User guide

### The numbers that matter

| Number | Where | Meaning |
|---|---|---|
| **Balance** | Hero, top | Cash in hand: opening (₹6,000 cash + ₹4,000 freelance payout) minus everything spent. |
| **Safe to spend today** | Hero, large figure | Today's fair share after upcoming bills and the ₹600 buffer are protected. |
| **Reconciliation** | Hero + breakdown | `opening − spent − bills = free + buffer` — every rupee accounted for, in one line. |
| **Risk** | Hero badge | Low / medium / high with a plain-language reason, never color alone. |

Balance and safe-to-spend sit in an `aria-live="polite"` region; a visually-hidden live region
announces a summary after every apply, discard, or reset.

### See the maths (tap the big number)

Click, tap, or press **Enter** on the safe-to-spend figure for the breakdown sheet: starting cash,
income, opening, spent, balance, bills, buffer, spendable, days left, the answer — plus a final
reconciliation line. **Escape**, **Close**, or outside-click closes it; focus returns to the number.

### Simulate before you spend

Purchases and subscriptions go through **Try a purchase first**; cancellations through
**Subscriptions** (shows monthly + yearly savings); surprises through **Unexpected expenses**
(pay now / split over 7 days / defer 7 days); savings through the goal card's transfer row. Every
path previews before anything moves — balance, safe-to-spend, goal date, forecast, risk, health —
then **Apply** commits it (and logs it) or **Discard** drops it without a trace. Applied a
wrong call? **Undo** in the decision log reverses the most recent apply, restoring every number.

Applied decisions cascade in order: balance → safe-to-spend → goal date → forecast → steadiness
(instant when reduced motion is requested). **Reset demo** in the footer restores day 12.

### Keyboard map

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move through every control (visible focus ring throughout) |
| `Enter` / `Space` | Open the breakdown, toggle chips, expand score parts and FAQ |
| `Escape` | Close the breakdown sheet |

---

## 3. Worked example: the ₹1,499 headphones

Day 12 of 30: balance ₹8,830 · bills ₹717 · spendable ₹7,513 · safe **₹395/day** · Goa finishes
**day 20** · forecast ≈ **₹6,092** · risk **low**.

Simulating **Headphones · ₹1,499** previews balance ₹7,331 · safe ₹316 · goal day 22 · forecast
≈ ₹4,593 · risk stays low with its reason stated. The preview sentence reads: *"₹1,499 is about
3.8× today's safe amount…"* Apply cascades the five updates; discard leaves every figure untouched.

Cancelling **Netflix · ₹199/mo** previews: month keeps ₹199, the year would have cost ₹2,388, safe
rises ₹395 → ₹405.

---

## 4. How the numbers work

Implemented exactly in `src/domain/formulas.ts` (JSDoc on every export), tested in
`src/domain/formulas.test.ts`:

| Formula | Seed value |
|---|---|
| `opening = openingBase + income received by today` | ₹10,000 |
| `balance = opening − sum(spent)` | ₹8,830 |
| `committedAhead = sum(commitments due day 12–30)` | ₹717 |
| `daysLeft = totalDays − currentDay + 1` | 19 |
| `spendable = max(0, balance − committedAhead − bufferTarget)` | ₹7,513 |
| `safeToSpendToday = floor(spendable / daysLeft)` | ₹395 |
| `goalPace = (target − saved) / max(1, deadlineDay − currentDay + 1)` | ₹173.68/day |
| `forecastEnd = balance − committedAhead − avgDailySpend × daysLeft` | ≈ ₹6,092 |
| `avgDailySpend = sum(spent) / (currentDay − 1)` | ₹106.36 over 11 days |
| `goalFinish = currentDay + ceil(remaining / max(1, safePerDay)) − 1` | day 20 |

---

## 5. The simulation model

One pure engine (`src/domain/simulate.ts → applyDecision(state, decision) → { state, ok }`)
serves both paths, so preview and apply can never disagree:

- **Preview:** `selectPreview` runs the draft through the engine on a copy and derives numbers.
  No state is touched; the log is untouched.
- **Apply:** the reducer commits the engine's output and appends one log entry. Unknown or
  consumed targets (double-cancel, answered shock) return `ok: false` and change nothing.
- **Discard:** clears the draft and any pending highlight timers. No log entry, no announcement
  residue beyond the polite "discarded" confirmation.

Decision kinds: `purchase`, `subscribe`, `cancel-subscription`, `shock` (pay-now/split/defer),
`transfer-goal` (moves cash into `saved` and records matching spent so the balance drops truthfully).

---

## 6. The health score

`src/domain/health.ts → calcHealth(...)`: four 0–100 parts, plain mean, rounded. Neutral by design.

1. **Cash cushion** — `balance / (2 × buffer)`, capped. Falls linearly as spending nears the buffer.
2. **Bills ahead** — `1 − committed / balance`. Smaller upcoming bills score higher; ≤0 balance → 0.
3. **Goal pace** — `(saved/target)` vs `(elapsed/totalDays)`. Ahead of schedule → toward 100.
4. **Spending rhythm** — `1 − cv/2` over days with spending (cv = coefficient of variation).
   Even days score high; one huge day among quiet ones scores low; <2 active days → neutral 80.

---

## 7. Accessibility decisions

- Semantics: landmarks, real buttons, labelled inputs; status always pairs color with text + icon.
- Live regions: numbers in `aria-live="polite"`; hidden region announces apply/discard/reset summaries.
- Dialog: `role="dialog"`, `aria-modal`, name, focus trap, Escape, focus returned to trigger.
- SVG charts carry `role="img"` with title/description; month strip is decorative with an SR summary.
- Contrast AA (4.5:1 body, 3:1 large), permanent visible focus rings, ≥44px targets.
- `prefers-reduced-motion` collapses stagger, swaps, and reveals to instant.
- Fluid type + wrapping grids: no horizontal scroll at 200% zoom; holds 320–1280px.
- Automated backstop: `src/a11y.test.tsx` runs axe on both views (0 violations). jsdom can't judge
  contrast/focus/motion, so those stay manual (see AUDIT.md).

---

## 8. Performance decisions

- No chart library (hand SVG), no router (hash routes), no images, no runtime fetches.
- Measured production bundle: **JS ~83KB gzip** (target <150KB ✓), **CSS ~7.9KB gzip** (✓);
  dialog code-split into its own 3.7KB chunk via `React.lazy` (null fallback, no layout shift).
- Measured with Lighthouse 13.4 on the production build — **mobile 97 / 100 / 100 / 100,
  desktop 100 across the board** (Performance / Accessibility / Best Practices / SEO).
  Accessibility went 96 → 100 by darkening the faint-ink token to a computed 4.9:1 minimum and
  moving 9px strip numerals onto the stronger ink. Full numbers and notes in AUDIT.md.
- Font stays optimal: self-hosted Inter Variable with `font-display: swap` + unicode-range, so only
  latin + latin-ext (~133KB, async) ever download.
- Derivations memoized; form inputs keep local state so typing never re-renders the tree; static
  components (`Wordmark`, `MonthStrip`) are `memo`'d. Animations touch transform/opacity only.
- No Lighthouse/axe-browser run was possible in this environment (no Chromium); bundle numbers and
  jsdom axe above are the measured substitutes, recorded honestly in AUDIT.md.

---

## 9. For developers

**Stack:** React 19 + Vite 8 + TypeScript (strict) + Tailwind v4. Dev-only: Vitest, jsdom,
Testing Library, axe-core, ESLint (ts, react-hooks, jsx-a11y).

```
src/
  domain/      # pure TS, zero React: types, formulas, health, risk, simulate, selectors
  state/       # store.ts — useReducer + draft layer + undo history + stagger timers;
               # scenario.ts — fixed month parameters and fresh-state factory
  data/        # seed.ts — the typed mock month, scenario comment included
  lib/         # format (INR, day math), series (forecast + SVG path builders)
  components/  # shared: dialog, simulator form, chart, health, wordmark, error boundary
  features/    # per-area UI: landing/*, goals, subscriptions, shocks, log, risk
  styles/      # index.css — tokens, type scale, motion (all reduced-motion aware)
```

Rules honored: no `any`, no unchecked casts, no non-null assertions; every file <250 lines;
`npm run lint` clean at `--max-warnings 0`; `npx knip` reports zero unused files, deps, or exports.
Components read through `selectDerived`/`selectPreview`, never recombine formulas. Amount rules,
cancellation maths, and shock copy live once in `src/domain/decisions.ts`, tested, and shared by
every panel. See `docs/decisions.md` for the why behind the big calls.

---

## 10. Testing

```bash
npm test            # all suites once
npm run test:watch  # watch mode
```

64 tests, 8 files: 12 core formula tests, 9 edge/opening cases, 6 risk classifications,
11 engine tests (all five decision kinds, double-apply rejection, input purity via frozen state),
7 decision-helper tests (validation, impact, shock copy), 4 selector tests, 8 store-flow tests
(preview/apply/discard/undo/reset at hook level), 5 simulator interaction tests (inline errors,
preview rows, apply, discard), 2 axe tests. Manual release checklist: fresh load with a
clean console → breakdown open/Escape → apply (1-2-3-4-5 order) → discard (nothing moves) → cancel
a subscription → answer a shock → undo → reset → keyboard-only full pass → 375/768/1280px.

End-to-end in a real Chromium (`node scripts/e2e.mjs` with `npm run dev` running): 23 checks cover
fresh load, overflow at 375/768/1280 on both views, keyboard-only dialog open/close with focus
return, preview → apply → discard, subscription cancel with annual impact, shock response, decision
log entries, undo restoring numbers, reset, and zero console errors or warnings.

---

## 11. Deploying to production

```bash
npm run build   # emits static files into dist/
```

Serve `dist/` from any static host. No env vars, no server; hash routing needs no server config.

---

## 12. Scope and limitations

- One fixed mock month (today = day 12); reload or Reset restores it.
- One goal; goal projection assumes up to today's safe amount saved daily (stated in UI as "around").
- Health and risk are descriptive signals, not financial advice.
- No Lighthouse/browser-axe run in this environment (see §8); visual/keyboard device pass still owed.

---

## 13. How the app maps to the brief

| Brief requirement | Implementation |
|---|---|
| ₹10,000 budget over 30 days, Gen Z voice | Seed scenario, plain specific copy, no shame language |
| Simulate before deciding; visible consequences | Draft-layer engine + per-kind previews + ordered cascade |
| Income connected to balance | Freelance payout in seed, hero caption, breakdown rows |
| Reconciliation in one place | `opening − spent − bills = free + buffer` (hero + dialog) |
| Goal finish date moves | GoalCard + `calcGoalFinishDay` |
| Subscriptions + cancel simulation | Subscriptions panel, monthly + annual impact |
| Shock events category | 3 shocks, 3 responses each |
| Named risk in text | RiskBadge + `classifyRisk` + preview rows |
| Health score, 4 components, tap-to-explain | HealthScore + `calcHealth` |
| Forecast line bends | ForecastChart dashed preview path |
| Apply/discard, discard leaves no trace | Reducer draft layer, DecisionLog (applied only) |
| Decision log with costs | DecisionLog (applied entries only) + Undo (history-capped) |
| Reduced-motion version | Instant updates, tested via media query |
| Small bundle, no chart lib, self-hosted font | §8 measurements |

---

## 14. FAQ

**Is any of this real money?** No. Fixed mock data, nothing leaves your browser.
**Do I need an account?** There isn't one. Reload to restart the month.
**What if I overshoot the safe amount?** Numbers recalculate, dates slip, reasons stated. No grades.
**What happens after day 30?** The demo ends there; a real version would close the month and start fresh.
