# Ontime domain invariants

Load only for touched domains. Add only stable, recurring invariants; not one-off bugs.

## Rundowns and entries

- Keep `entries`, `order`, `flatOrder` normalised.
- Keep group membership, group entry lists, child `parent` references consistent.
- Preserve entry identity and supported types across patch, clone, group, ungroup, reorder.
- Distinguish loaded vs background rundown. Prefer explicit rundown ID over global current state.
- No caller-owned rundown mutation unless explicitly contracted.

## Persistence, realtime, cache

- No partial commit on failure.
- Preserve revision/transaction semantics for loaded and background rundowns.
- Persist before websocket refetches, runtime updates, integration notifications, or cache assumptions.
- Notify only invalidated consumers; never leave client cache stale.
- Avoid duplicate listeners, notifications, invalidations, lifecycle effects.
- Reconnect/refetch must converge on authoritative state.
- Align query keys and websocket refetch keys with the changed resource.

## Timers

When relevant, cover interactions among:

- midnight/day offsets;
- linked events/gaps;
- delays/skipped entries;
- count-to-end;
- absolute/relative offsets;
- warning, danger, finish, roll, end-action transitions;
- loaded/next-event state.

Pass time/state explicitly to keep rules deterministic and unit-testable.

## Imports and migrations

- Treat project files, spreadsheets, custom fields, migrated data as untrusted.
- Preserve fields the import/migration does not own.
- Validate/parse into the current model before runtime logic.
- Avoid source mutation; test round trips and non-mutation when preservation matters.
