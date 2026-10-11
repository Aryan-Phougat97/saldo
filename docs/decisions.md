# Decisions

## Why a pure domain layer with a draft-based store

Preview and apply must never disagree — a preview showing ₹316 that applies as ₹315 would destroy
trust in a money app. One pure `applyDecision(state, decision)` serves both: preview runs it on a
copy, apply commits its output. The reducer stays the single owner; components only read selectors.
Tested with frozen inputs to prove no mutation.

## Why no chart library

The forecast is one polyline plus one dashed preview line. A library would add ~50–200KB for
nothing the app needs, and hand SVG keeps full control of `role="img"` naming and reduced-motion
behavior.

## Why self-hosted fonts via the package (not link tags)

No runtime network requests is a product requirement. The variable-font package with
`font-display: swap` + unicode-range means browsers fetch only latin + latin-ext, asynchronously,
with system-font fallback — the best of all options without custom subsetting pipelines.

## Why hash routing

Two views, zero dependencies, zero server config: `#` vs `#/app` works from any static host. The
one subtlety (scroll reset fighting in-page anchors) is handled by resetting scroll only on actual
view switches.

## Why React.lazy only for the dialog

It is the sole UI hidden behind an interaction. Everything else is above the fold on at least one
view; splitting further would add loading states without measurable gain (main JS is ~83KB gzip
against a 150KB budget).

## Why undo lives in the reducer as snapshots

A wrong apply must restore *every* number, including the log itself. Reversing by arithmetic
(removing one spent line) would desync derived state the moment kinds interact, so each apply
pushes the pre-apply committed slice onto a capped history stack (30). Undo pops it. Drafts are
excluded — undo never resurrects a preview. Covered at hook level (stacked undos, empty history,
post-reset) and in the browser e2e.

## What was deliberately not built

Multi-month state, editable history, categories, accounts, and a real backend — all out of the
brief's scope. The docs state these as limitations rather than leaving them implied.
