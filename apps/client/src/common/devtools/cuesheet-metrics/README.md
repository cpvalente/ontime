# cuesheet-metrics (TEMPORARY)

Dev-only instrumentation to measure the **first-render (mount) cost of virtualised cuesheet
rows**, so the scroll-performance optimizations can be supported by before/after numbers.

> This whole directory is temporary and must be deleted once the optimizations are proven.
> Every edit it makes to existing files is tagged `// PERF-METRICS`.

## Enable

Open the cuesheet in a **dev build** with the `?perf=1` query param:

```
http://localhost:3000/cuesheet?perf=1
```

Nothing is collected and nothing is exposed unless both conditions hold (`isDev && ?perf=1`).
In production builds `isDev` is `false`, so all recording paths are runtime-inert.

## Measure

A console API is exposed on `window.__cuesheetPerf`:

- `runScrollBenchmark(options?)` — deterministic, hands-off scroll from `fromIndex` to
  `toIndex` and back, then prints the result. Use the same options before/after a change so
  numbers are comparable. Options: `{ fromIndex=0, toIndex=200, stride=8, stepMs=16 }`.
- `start()` / `stop()` — begin a manual session, scroll by hand, then stop to print.
- `dump()` / `reset()`.

To emulate a low-end device, set Chrome DevTools → Performance → CPU 4×–6× slowdown, then run
the benchmark 3× and compare medians.

## What is reported

- **Summary:** rows mounted, frames, long frames (>~25ms), avg/min FPS, worst frame ms.
- **Marks** (count / avg ms / max ms / total ms):
  - `EventRow.mount` — whole-row mount time (render-start → post-commit layout)
  - `cell.tooltip.mount` — mount of a delay-indicator tooltip subtree (portal/positioner)
  - `row.colourCalc` — per-row colour-accessibility computation
  - `row.getVisibleCells` — react-table visible-cell expansion
  - `cell.autosize` — `AutoTextarea` autosize + MutationObserver setup
  - `cell.reactiveInputInit` — `useReactiveTextInput` hotkey-handler construction
  - `longtask` — main-thread long tasks captured during the session (where supported)

## Teardown

1. `rg "PERF-METRICS" apps/client/src` → revert each tagged line in the existing files
   (`CuesheetTable.tsx`, `EventRow.tsx`, `AutoTextarea.tsx`, `Tooltip.tsx`,
   `useReactiveTextInput.tsx`) back to its original body.
2. Delete this directory.
3. `rg "cuesheet-metrics|__cuesheetPerf" apps/client/src` → must be empty.
4. `pnpm typecheck && pnpm test:pipeline && pnpm build`.
