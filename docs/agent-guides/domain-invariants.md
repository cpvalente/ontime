# Ontime domain invariants

Load only for touched domains. Add only stable, recurring invariants; not one-off bugs.

## Rundowns and entries

- Keep `entries`, `order`, `flatOrder` normalised.
- Keep group membership, group entry lists, child `parent` references consistent.
- Preserve entry identity and supported types across patch, clone, group, ungroup, reorder.
- Distinguish loaded vs background rundown. Prefer explicit rundown ID over global current state.
- No caller-owned rundown mutation unless explicitly contracted.
- Revisions mark change: a rundown revision advances on every commit. An entry revision advances
  when its fields are edited (patch, swap, renumber, apply delay); structural moves (reorder, group,
  ungroup) only advance the rundown revision. Delays carry no revision. Optimistic client edits apply
  the same bump the server does, so an unchanged entry keeps its identity.

## Persistence, realtime, cache

- No partial commit on failure.
- Preserve revision/transaction semantics for loaded and background rundowns.
- Persist before websocket refetches, runtime updates, integration notifications, or cache assumptions.
- Notify only invalidated consumers; never leave client cache stale.
- Avoid duplicate listeners, notifications, invalidations, lifecycle effects.
- Reconnect/refetch must converge on authoritative state.
- Align query keys and websocket refetch keys with the changed resource.
- Runtime store keys are state: clients ignore a patch equal to what they hold and receive the whole store on connect. A command which must take effect when repeated changes the state, eg: a new timestamp.

## Timers

Use temporal values by meaning: `Instant` for epoch time, `TimeOfDay` for local time since midnight, `Duration` for elapsed time, `Day` for calendar offsets. Convert through `timeCore`; never interchange as raw numbers.

Active work: [runtimeState time-core migration](../migrations/runtime-state-time-core.md).

When relevant, cover interactions among:

- midnight/day offsets;
- linked events/gaps;
- delays/skipped entries;
- count-to-end;
- absolute/relative offsets;
- warning, danger, finish, roll, end-action transitions;
- loaded/next-event state.

Pass time/state explicitly to keep rules deterministic and unit-testable.

## Teleprompter

- The server cuts the script into rows; screens render rows and only size the text, so every screen counts the same lines.
- The reading position is a place in the text, `{ eventId, charOffset, lines }`, carried through edits. Row numbers are only calculated from it.
- Screens calculate the position from the transport and the server clock. They never measure the page to find it.

## Reports

- A report is one aggregate containing its event records, show timing, and rundown snapshot.
- Capture the rundown plan when the report starts; later rundown edits must not change it.
- Store day offsets with report timestamps. Use absolute timeline positions for ordering and duration, and wall-clock values only for display.

## Imports and migrations

- Treat project files, spreadsheets, custom fields, migrated data as untrusted.
- Preserve fields the import/migration does not own.
- Validate/parse into the current model before runtime logic.
- Avoid source mutation; test round trips and non-mutation when preservation matters.
