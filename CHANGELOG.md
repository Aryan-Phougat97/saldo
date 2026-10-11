# Changelog

## Round 2 — architecture, quality, undo

- Knip pass: removed one dead dependency (`axe-core`, unused direct install) and one speculative
  helper (`daysBetween`); wired the remaining flagged exports into real use (`calcOpening`,
  `sumSpent`, `RiskLevel`); un-exported internals. Knip now reports zero unused items.
- Centralized validation, cancellation maths, and shock copy in `src/domain/decisions.ts`
  (tested); Simulator, GoalCard, Subscriptions, and Shocks all read from it.
- Undo: history-capped snapshots in the reducer, Undo button in the decision log with empty-state
  disabling and polite announcements.
- Tests: 42 → 64 (store flows, simulator interaction, decision helpers, opening/sum coverage).
- Split `src/state/store.ts` back under 250 lines (`scenario.ts` extracted).
- E2E: 21 → 23 checks (undo restore + log shrink).

## Improvement pass (Batch A–F)

### Architecture
- New `src/domain/` pure layer: types, formulas, health, risk, simulation engine, selectors —
  JSDoc on every export, zero React imports.
- State in one place: `src/state/store.ts` (`useReducer`, typed actions, draft layer, timer
  cleanup). Removed impure module counter and `useState` sprawl.
- Deduplicated sparkline path, derivation, and forecast series into `src/lib/series.ts`;
  formatting/day-math into `src/lib/format.ts`.
- Split 600-line landing into `src/features/landing/` (6 files); seed moved to `src/data/seed.ts`;
  styles to `src/styles/`. Every file under 250 lines.
- Removed all `as` casts and `any[]` typings.
- Added `ErrorBoundary` with a friendly fallback + reset.

### Features (Problem Alignment)
- Income: freelance payout in seed, hero caption, breakdown rows, reconciliation line.
- Subscriptions panel with cancel simulation (30-day + annual impact).
- 3 shock events with pay-now / split / defer responses.
- Named risk badge (low/medium/high + text reason) in hero and every preview.
- Goal transfer action with preview.
- Decision log with per-item cost; empty states for log, shocks, subscriptions, zero balance.
- Amount caps with inline errors; Reset demo button.

### Quality
- ESLint (ts, react-hooks, jsx-a11y) + `lint`/`typecheck` scripts — zero warnings/errors.
- Tests: 12 → 42 (edge cases, risk, engine incl. purity, selectors, axe on both views).
- Performance: dialog code-split, font verified optimal, memo'd statics, measured bundle
  (JS ~83KB gzip, CSS ~7.9KB gzip).

### Docs
- README rewritten (guide, formulas, simulation model, normalization, a11y/perf decisions,
  brief map). New AUDIT.md, CHANGELOG.md, docs/decisions.md.
