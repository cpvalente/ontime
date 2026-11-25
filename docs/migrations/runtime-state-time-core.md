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

Completed:

- temporal brands in `ontime-types`;
- `timeCore` helpers for now, conversion, duration arithmetic, calendar-day distance, and resolving a time of day to its nearest or next instant;
- timer calculations (`getCurrent`, `getExpectedFinish`, `getElapsed`, `getRuntimeOffset`, `skippedOutOfEvent`) run on `_epoch` and private `Instant` fields (`_timer.startedAt`, `_timer.pausedAt`, `_startEpoch`); count-to-end and offsets anchor to the rundown day;
- roll waits on an `Instant` target and starts events on the schedule shifted by the offset;
- the restore point saves start and pause as instants and rejects older time-of-day values.

Remaining ambiguity:

- `TimerState`, `RundownState`, and `Offset` expose temporal fields as `number`/`MaybeNumber`; public `TimeOfDay` fields (`timer.startedAt`, `rundown.actualStart`, `actualGroupStart`) are still assigned beside their instants rather than derived from them;
- `loadRoll` selects the roll event by time of day with its own day counting (`normaliseEndTime`, `checkIsNow`); moving it to instants needs a rule for anchoring rundown day 0 before the show starts;
- `_startDayOffset` comes from `findDayOffset` on times of day;
- `timeCore.toInstant` applies the reference's UTC offset to the whole day, so times across a DST change on that day are an hour off (pinned by an `it.fails` test).

Before the pure timer calculations can move to `ontime-utils` for client use:

- `getRuntimeOffset` asserts its inputs in `DEV` blocks, which only the server build strips;
- clients do not receive `pausedAt`, `pausedDuration`, `_startDayOffset`, `hasFinished`, `triggerAhead` or the expected-time lookahead.

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
