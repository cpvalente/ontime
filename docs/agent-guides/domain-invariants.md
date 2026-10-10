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
- There is one script, shaped only by the project's teleprompter settings. View options change how a view shows it, never what it holds or where its lines break.
- Events which are skipped or have no script do not exist for the teleprompter: the script leaves them out, and every way of naming an event (index, cue, id, the loaded event) resolves in the script, so an index counts its events.
- The mode (`event`, event by event: stops at the end of each event and follows the event Ontime loads; or `script`, the whole script) belongs to the transport, like speed, and only commands change it. A local view's options set where its own transport starts; views never assert the shared transport's state when they load or connect.
- The shared teleprompter publishes two runtime store keys, together when both change. `teleprompter` is the readable contract for people and integrations, in the words of the commands (`playback`, `mode`, the event being read, time left), described from the transport by one pure function every view uses; it is sent with the clock each second while playing. `teleprompterSync` is internal: the reading position the server calculates for following screens, in rows of a named script revision (`row` at time `at`, moving at `speed` until `until`), changing only on commands, script rebuilds and the end of playback, never with time.
- The clock tick is the only timer: while playing, each tick settles the transport, so playback which reached its end stops there and both keys are published. Screens stop on the exact line on their own, because they clamp at `until`; `ended` arrives up to a second later. A local view settles its own transport on a one second interval the same way. A screen whose script has another revision holds its place until it has that script, so a screen which connects or reboots lands where the others are.
- The reading position is a place in the text, `{ eventId, charOffset, lines }`, carried through edits. Row numbers are only calculated from it, by the host which holds the transport: the server for shared playback, the browser for a local view.
- Screens calculate the position from a sync and the server clock: what the server published, or, for a local view, the sync it describes from its own transport with the same function. They never measure the page to find it.
- Moving between events is a command, resolved against the script when it runs; nothing stores an event index, so rundown changes never break playback.
- The shared script is built on read: changes only mark it stale, so server code using the script or its layout rebuilds it first. Its revision changes only when its lines do. A build which fails is logged and keeps the last script until the next change, so a broken script never stops the runtime or the commands.
- The script is derived from the rundown and the teleprompter settings, so screens refetch it on those refetches.
- Teleprompter settings changed in an open project, from the settings endpoint or a project patch, go through `applyTeleprompterSettings`, which parses them and invalidates the script. A loaded project file is parsed with the rest of the project.

## Reports

- A report is one aggregate containing its event records, show timing, and rundown snapshot.
- Capture the rundown plan when the report starts; later rundown edits must not change it.
- Store day offsets with report timestamps. Use absolute timeline positions for ordering and duration, and wall-clock values only for display.

## Imports and migrations

- Treat project files, spreadsheets, custom fields, migrated data as untrusted.
- Preserve fields the import/migration does not own.
- Validate/parse into the current model before runtime logic.
- Avoid source mutation; test round trips and non-mutation when preservation matters.
