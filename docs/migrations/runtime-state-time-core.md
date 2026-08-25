# runtimeState time-core migration

**Status:** In progress

## Goal

Make temporal meaning explicit across `runtimeState` and timer calculations. Prevent mixing:

- `Instant`: epoch timestamp;
- `TimeOfDay`: local milliseconds since midnight, range `[0, dayInMs)`;
- `Duration`: elapsed or remaining milliseconds;
- `Day`: calendar-day offset.

Use `apps/server/src/lib/time-core/timeCore.ts` for conversions and temporal arithmetic. Branded types remain numbers at serialization boundaries.

## Current state

Completed foundation:

- temporal brands in `ontime-types`;
- `timeCore` helpers for now, conversion, duration arithmetic, midnight crossing, calendar-day distance;
- partial `runtimeState` adoption of `Instant`, `TimeOfDay`, `Day`, and `timeCore`.

Remaining ambiguity:

- `TimerState`, `RundownState`, and `Offset` expose temporal fields as `number`/`MaybeNumber`;
- `timerUtils` accepts/returns raw numbers with different meanings;
- `runtimeState` retains raw duration fields, manual arithmetic, and `as TimeOfDay`/`as Duration` casts.

## Migration rules

- Classify each temporal field before changing it. No generic `Time` type.
- Convert only through `timeCore` or an explicit transport adapter.
- Keep public/websocket JSON numeric where required; brand at the boundary.
- Keep type migration separate from behaviour changes.
- Preserve current midnight, rollover, pause, add-time, roll, and offset behaviour per slice.
- Add helpers only when they encode a named temporal rule and remove caller casts/arithmetic.

## Slices

- [x] Add temporal brands and initial `timeCore` helpers/tests.
- [ ] Inventory temporal fields in `TimerState`, `RundownState`, `Offset`, and private runtime state; assign intended types.
- [ ] Migrate pure `timerUtils` functions by temporal concept; add focused midnight/rollover tests.
- [ ] Migrate private `RuntimeState` fields and calculations; remove local casts/manual conversions.
- [ ] Migrate shared runtime contracts and add numeric transport adapters where compatibility requires them.
- [ ] Update remaining callers, fixtures, and mocks.
- [ ] Remove superseded helpers, casts, and ambiguous temporal numbers.

Each slice must leave old/new boundaries explicit, compile cleanly, and preserve behaviour.

## Required coverage

- before, at, and after midnight;
- overnight and multi-day rundowns;
- local-day calculation across timezone/DST offset changes;
- pause/resume, added time, elapsed/remaining duration;
- roll secondary targets and expected finish;
- absolute/relative offsets and day offsets.

## Complete when

- Runtime/timer boundaries use semantic temporal types or documented numeric transport fields.
- Temporal conversions/arithmetic use `timeCore` or named pure helpers.
- No unexplained temporal casts or ambiguous numeric fields remain in migrated scope.
- Focused tests cover the required boundaries.

After completion, remove this migration tracker. Keep durable rules in `docs/agent-guides/domain-invariants.md`.
