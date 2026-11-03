# Simplicity and maintainability

Use for abstractions, comments, helpers, naming, or structural complexity.

## Simplicity

Choose the smallest explicit, testable design. No extension points, generic engines, wrappers, or config for hypothetical needs.

- Prefer direct flow over clever expressions or scattered conditions.
- Extract only to name a rule, enable pure tests, or remove meaningful duplication.
- Keep abstractions only when they reduce reader-held concepts.
- Reuse the concept owner when semantics match.
- Do not add flags, optional branches, generic names, or extension points to merge unlike cases.
- Prefer focused local helpers over generic APIs exposing unrelated modes.
- Keep scope narrow; note unrelated cleanup.
- Delete clearly obsolete branches, harnesses, and shims. Ask when ownership or compatibility is unclear.

## Defensive code

Ontime runs one server with few clients. Guard real failure paths, not theoretical ones.

- Validate external input, including third-party response data, once at its owner (see [security](security.md));
  trust typed internal values after that.
- Model third-party errors by the shape the installed library throws; check its source, not every shape it could throw.
- Do not add per-request state, ownership tokens, or locks for races that need concurrent requests plus slow user
  actions to line up. Accept them when the worst case is recoverable by a retry, refresh, or reconnect. Never for
  persistence, runtime state, or playback, where a race can lose, corrupt, or misorder state.
- Do not wrap a fallback in another try/catch, or guard against helpers failing in ways they do not.
- Match error intent, not library message strings, when any failure of that call means the same thing to the user.

## Comments

Keep comments for:

- non-obvious intent or invariants;
- necessary ordering, timing, mutation, or side effects;
- browser, Electron, cloud, or protocol constraints;
- workaround reasons and removal conditions;
- public contracts names/types cannot express.

Remove comments that:

- narrate code or names;
- number obvious steps;
- explain mechanics better expressed by code;
- preserve removed history;
- claim untested behaviour;
- use banners to hide oversized modules.

Update adjacent comments with code. Stale comments are defects.

Add a short comment immediately above every React `useEffect` describing the external synchronization or lifecycle
responsibility it owns. Explain non-obvious reasons or constraints when they matter; for files with multiple effects, a
brief responsibility label is useful even when the mechanics are straightforward.

## Naming and types

- Prefer Ontime terms over vague `data`, `result`, `item`.
- Prefer explicit/discriminated types over `any`, broad casts, optional fields, non-null assertions, silent fallbacks.
- Handle unions/enums exhaustively when future cases could be unsafe.
- Keep public functions focused enough to avoid long contract explanations.

## Logging

- Log what the server did, or deliberately withheld, that nothing on screen explains. Do not log what the UI already shows.
- Pass values as fields, never in the message: `logger.info(LogOrigin.Automation, 'Automation skipped', { reason: 'filters', title })` writes `Automation skipped reason=filters title="House lights"`. Users find entries by searching the message.
- The message is subject first, past tense, sentence case, and does not repeat the origin: `Restore skipped`, `HTTP send failed`, `Client connected`. Failures read `<subject> failed` with `error=` or `status=`; deliberate holds read `<subject> skipped` with a kebab-case `reason=`.
- Reuse field names: `project`, `rundown`, `cue`, `title`, `client`, `source`, `target`, `port`, `state`, `reason`, `status`, `error` last. Identify events by `cue` and `title`; use `id` only when both are empty.
- API actions which change playback are logged once with their `source` and `client` in `dispatchFromAdapter`; services log the outcome, not the sender.
- Write diagnostics through the logger, not `console`. The session log and the log view are what users see; the console is not shown in production.
- Paths that run every second (timer ticks, `onUpdate`/`onClock` automations) log failures only, once per target until it recovers.

## Review standard

Do not demand personal style. Report complexity only when it risks maintenance, hides rules, blocks focused tests, duplicates ownership, or makes changes unsafe. Suggest reuse only after verifying the existing contract fits without added genericity.
