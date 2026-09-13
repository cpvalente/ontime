# Automation UI Foundation and Global Composer Tasks

## PR 1 — automation UI foundation

### Completed implementation

- [x] Start from clean `master` and retain the mixed branch as reference only.
- [x] Keep automation create/edit payloads definition-only.
- [x] Preserve global and event trigger references when definitions are edited.
- [x] Refuse deletion of definitions referenced by global triggers or rundown events.
- [x] Reject trigger bindings submitted to definition CRUD.
- [x] Persist normalized output values returned by server validation.
- [x] Support the full filter-operator contract, including `not_contains`.
- [x] Extract focused OSC, HTTP, Ontime, and output-card form components.
- [x] Add honest per-output test success/error feedback and failed-save retry behavior.
- [x] Add shared lifecycle labels and output summaries.
- [x] Clarify global trigger scope, duplicate behavior, and missing references.
- [x] Improve event trigger lifecycle labels and output visibility.
- [x] Keep recipes, composer code, and lifecycle-on-definition state out of the PR.
- [x] Cover shared lifecycle labels, the full filter-operator contract, controller rejection of trigger fields, and
      definition output replacement with focused regression tests.

### Required before merge

- [x] Accept IPv6 OSC targets as well as IPv4 and hostnames.
  - [x] Add a parser regression test using an IPv6 target such as `::1`.
  - [x] Keep runtime-template hostname support and normalized persistence intact.
- [x] Remove stale output-form styles that no rendered component references.
  - `oscSection`
  - `httpSection`
  - `actionSection`
  - `outputCard`
  - nested `test`
- [x] Run the browser smoke check:
  - create and edit a definition;
  - add, remove, and test OSC, HTTP, and Ontime outputs;
  - retry a save after a server error;
  - create/edit a global trigger;
  - attach the same definition to an event;
  - verify missing and duplicate states;
  - verify narrow-panel horizontal scrolling and sticky headers.
- [x] Show the concise server validation message after a failed save instead of the full raw 422 response and submitted
      definition; keep the form open and retryable.
- [x] Re-run final verification and inspect the final diff for temporary code, stale comments, generated files, and
      recipe/composer leakage.

### Verification already observed

- [x] Server test pipeline: 51 files passed; 778 tests passed; 6 todo.
- [x] Client test pipeline: 34 files passed; 276 tests passed.
- [x] Client and server type checks passed.
- [x] Client and server lint passed.
- [x] Format check passed.
- [x] Client and server builds passed with only existing Vite warnings.
- [x] `git diff --check master...HEAD` passed.

### PR 1 checkpoint

- [x] IPv6 compatibility and stale-style cleanup are committed to their owning commits.
- [x] Added PR 1 regression coverage is committed separately from production behavior.
- [x] Browser smoke check is recorded.
- [x] PR 1 is self-sufficient and ready for human review.

## PR 2 — global automation composer and recipes

### Task 1: Define the composition contract

- [ ] Add a create-only command containing a definition plus zero or more global lifecycles.
- [ ] Return the created definition and trigger bindings.
- [ ] Keep persisted `Automation` and `Trigger` entities and ordinary CRUD unchanged.
- [ ] Document that zero lifecycles saves a reusable definition only.

### Task 2: Add atomic global composition creation

- [ ] Validate the definition and every lifecycle before writing.
- [ ] Normalize or reject duplicate lifecycle inputs consistently.
- [ ] Assign IDs and persist the definition and bindings in one settings write.
- [ ] Test success, invalid input, duplicate inputs, and no-partial-write failure behavior.

### Task 3: Build the manual composer

- [ ] Present separate Global trigger, Conditions, and Actions sections.
- [ ] Reuse the PR 1 output editor components where their contracts fit.
- [ ] Support multiple global lifecycles and definition-only save.
- [ ] Test failed-save retry and refresh of both definitions and triggers.

### Task 4: Move recipes onto the composer

- [ ] Restore the recipe catalog and parameter setup without restoring trigger ownership to definitions.
- [ ] Make every recipe declare global lifecycle defaults explicitly.
- [ ] Submit manual and recipe flows through the same composition command.
- [ ] Test representative OSC, HTTP, and Ontime recipes.

### Task 5: Evaluate complete usage counts

- [ ] Implement a pure aggregation over global triggers and all project rundowns.
- [ ] Test zero usage, both scopes, multiple rundowns, duplicates, and missing references.
- [ ] Confirm the read path performs no repeated per-definition scans or persisted counting.
- [ ] Ship the UI count only if both global and event usage are complete and cheap; otherwise record the decision to
      defer it.

### Task 6: Integrate and verify

- [ ] Keep event-scoped recipes and event-composer navigation absent.
- [ ] Verify disabled automations, errors, modal keyboard behavior, and narrow layouts.
- [ ] Run full tests, type checks, lint, formatting, and builds.
- [ ] Review the final diff for stale compatibility code and scope leakage.

### PR 2 checkpoint

- [ ] Manual and recipe flows create global compositions atomically.
- [ ] Reusable definitions remain independently editable and attachable in both scopes.
- [ ] Usage information is complete or intentionally omitted.
- [ ] PR 2 is ready for human review.
