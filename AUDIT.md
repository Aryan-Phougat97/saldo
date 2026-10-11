# Saldo — improvement pass: architecture, features, docs

## Problem Alignment checklist (all done)

| # | Requirement | Status | Where |
|---|---|---|---|
| 1 | Income visible + connected to balance | done | `src/data/seed.ts` (freelance payout), hero caption + breakdown rows (`src/App.tsx`, `src/components/BreakdownDialog.tsx`) |
| 2 | Balance/spending/commitments reconciled in one place | done | Reconciliation line in hero + breakdown (`opening − spent − bills = free + buffer`) |
| 3 | Goal finish date updates with pace | done | `src/features/goals/GoalCard.tsx`, `calcGoalFinishDay` |
| 4 | Subscriptions cancellable, 30-day + annual impact | done | `src/features/subscriptions/Subscriptions.tsx` (monthly + ×12 lines) |
| 5 | Shock events as a distinct category (3–4) with responses | done | `src/data/seed.ts` (3 shocks), `src/features/shocks/Shocks.tsx` (pay/split/defer) |
| 6 | Named Risk (low/med/high + text reason) | done | `src/domain/risk.ts`, `src/features/risk/RiskBadge.tsx`, hero + all previews |
| 7 | Health = single score, 3–4 barred parts, tap-to-explain | done | `src/domain/health.ts`, `src/components/HealthScore.tsx` |
| 8 | Forecast line bends on decisions | done | `src/components/ForecastChart.tsx` (dashed preview path) |
| 9 | Preview any decision incl. risk + health; clean discard | done | `selectPreview` + per-kind preview cards; discard clears draft + timers |
| 10 | Decision log with per-item cost | done | `src/features/log/DecisionLog.tsx`, `log` in store |

## Weaknesses found → category → fix

- **A1.** `useState` sprawl, impure module `simId`, timer leaks → Architecture → `src/state/store.ts` (`useReducer`, pure engine, timer refs + unmount cleanup).
- **A2.** Domain/UI mixed in `src/lib/finance.ts` → Architecture → `src/domain/` (formulas, health, risk, simulate, selectors, types) with JSDoc on every export.
- **A3.** Duplicated sparkline path, derivation, cumulative series → Architecture → `src/lib/series.ts` (`linePath`, `buildForecastSeries`).
- **A4.** `as` casts (3), `any[]` arrays → Code Quality → typed keys, typed `number[]`.
- **A5.** No ESLint, no lint/typecheck scripts → Code Quality → `eslint.config.js` (+ts, hooks, a11y), `lint` + `typecheck` scripts. Zero warnings.
- **A6.** `Landing.tsx` ~600 lines → Architecture → `src/features/landing/` (6 files, all <250 lines).
- **A7.** No error boundary → Architecture → `src/components/ErrorBoundary.tsx` with reset.
- **A8.** Real bugs: spent header showed ₹0 at zero balance; hardcoded "day 12–30"; hardcoded `/29` → Functionality → fixed in `App.tsx`, `BreakdownDialog.tsx`, `ForecastChart.tsx`.
- **A9.** Whole Inter Variable family bundled → Performance → verified `swap` + unicode-range on-demand (only latin + latin-ext download, ~133KB); dialog code-split via `React.lazy` (`BreakdownDialog-*.js`, 3.7KB).
- **A10.** No automated a11y test → Accessibility → `src/a11y.test.tsx` (axe on both views, 0 violations). Caught + fixed one real harness issue during development.
- **A11.** Missing edge tests → Functionality → 40 tests (`risk`, `simulate` incl. purity, `selectors`, formula edges).
- **A12.** README lacked architecture diagram, simulation model, normalization, brief map → Documentation → rewritten (see README).

## Bundle sizes (production build)

- `index-*.js` 278KB / **~83KB gzip** (target <150KB gzip ✓)
- `BreakdownDialog-*.js` 3.7KB (lazy chunk)
- `index-*.css` 38.5KB / **~7.9KB gzip** (target <30KB gzip ✓)
- Fonts: latin 48KB + latin-ext 85KB download in practice; other subsets never fetch (unicode-range).

## Round 2 — rigorous quality pass

- Knip: removed `axe-core` (unused direct dep) and `daysBetween` (speculative helper); wired
  `calcOpening`, `sumSpent`, `RiskLevel` into real use; un-exported `StoreShape`; collapsed
  `BudgetStore` into `Budget`. Knip reports zero unused files, deps, or exports.
- `src/domain/decisions.ts`: single tested home for amount validation, cancellation impact, and
  shock copy (was duplicated across three panels).
- Undo via capped reducer history, tested at hook level and in e2e.
- Tests 42 → 64; e2e 21 → 23; `store.ts` split back under 250 lines.

## Verification log (final)

Measured with Lighthouse 13.4 against the **production build** (`npm run build` +
`vite preview`), mobile (simulated throttling) and desktop. Re-verified on a fresh build
after the contrast/favicon/robots fixes — identical results:

| Category | Mobile | Desktop |
|---|---|---|
| Performance | 97 | 100 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

Remaining sub-0.9 notes: FCP 2.1s on throttled mobile (0.81), 46KB "unused JavaScript" (React
itself — irreducible without dropping the framework), render-blocking CSS insight (normal for
any utility-CSS build). The experimental Agentic Browsing category scores 75 on one audit,
`ard-schema`: it fetches `/ai-catalog.json` and our SPA fallback serves HTML. Deliberately left
alone — Saldo exposes no agent resource, and inventing a catalog entry for one would be fake
content to game a metric (see `docs/decisions.md`). On hosts without SPA fallback the file 404s
and the audit correctly excludes itself.

| Check | Result |
|---|---|
| `npm run lint` (`--max-warnings 0`) | 0 warnings |
| `npm run typecheck` | 0 errors |
| `npx knip` | 0 unused files, deps, exports |
| `npm run build` | 0 errors (exit 0) |
| `npm test` | 64 passed (8 files) |
| axe (jsdom, landing + demo) | 0 violations |
| Playwright end-to-end (chromium, `scripts/e2e.mjs`) | 21/21 pass, 0 console errors, 0 warnings |
| Fresh-load console errors | none (captured in e2e) |
| Layouts 375 / 768 / 1280 | 0px overflow on both views, screenshots inspected |

## Manual checks still owed to a real device

jsdom cannot judge contrast, focus visibility, or reduced-motion behavior. Before calling this
finished on hardware: tab the full simulate flow keyboard-only, confirm the focus ring on every
control, toggle `prefers-reduced-motion` and re-apply (all five updates must land instantly), and
eyeball 375/768/1280px plus 200% zoom. The markup, targets (≥44px), tokens, and motion queries are
unchanged from the previously verified pass, so risk is low but the pass is still owed.
