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

## Review standard

Do not demand personal style. Report complexity only when it risks maintenance, hides rules, blocks focused tests, duplicates ownership, or makes changes unsafe. Suggest reuse only after verifying the existing contract fits without added genericity.
