# Automation UI Foundation and Global Composer Plan

## Decision

Keep the work split into two pull requests:

1. **PR 1 — automation UI foundation:** reusable definition editing, clearer global/event trigger surfaces, output
   editing, and validation hardening.
2. **PR 2 — global automation composer and recipes:** one create flow that produces a reusable definition and zero or
   more global trigger bindings.

The implementation confirms that this boundary is workable. PR 1 is useful without recipes and does not move lifecycle
ownership into automation definitions. PR 2 can therefore build on a stable definition/trigger model instead of
repairing the old mixed branch.

## Architecture decisions

- An automation definition owns its title, filters, and outputs.
- A trigger owns lifecycle, scope, and the reference to a definition.
- The composer is a create-time orchestration over those two existing resources; it is not a new persisted entity.
- The first composer creates global bindings only. Event-scoped recipes remain out of scope.
- Users may continue editing definitions and triggers independently after creation.
- Recipes use the same composition command as the manual composer.
- Usage is derived, not persisted. Show it only if complete global and event counts can be obtained with one bounded
  aggregation; otherwise omit it.

## Current PR 1 assessment

Branch: `automation-ui`

Commits:

- `b38e5de9` — template-aware output validation and normalized persistence.
- `1732c7cc` — definition/output editing, clearer global/event trigger presentation, and regression coverage for the
  definition/trigger boundary and shared presentation helpers.

The two commits can remain in one PR. Although the total diff is slightly above the normal review target, much of it is
the extraction of the existing output form into focused components, and the final behavior is one coherent foundation.
Do not create a third PR solely for the validation commit.

### Review result

The code-review findings are resolved:

- IPv6 support is restored in OSC target validation with a `::1` regression test while IPv4, hostname, and runtime
  template handling remain covered.
- The obsolete `oscSection`, `httpSection`, `actionSection`, `outputCard`, and nested `test` styles left behind by the
  output-card extraction have been removed.

The browser smoke check passed for definition creation/editing, all output types, failed-save retry, global trigger
editing, event attachment, duplicate and missing-reference states, and narrow-panel scrolling with sticky headers. It
revealed one small UX issue which is now fixed: server-side validation failures show the concise validation message (for
example, `Invalid OSC target`) instead of the complete raw 422 response and submitted definition.

No recipe, composer, lifecycle-on-definition, or event-scoped recipe work should be added while closing these items.

## PR 2 sequence

1. Define a create-only global composition request and response without changing definition CRUD.
2. Implement atomic server creation of one definition plus distinct global lifecycle bindings.
3. Build a manual `When -> If -> Then` composer using the PR 1 output editors.
4. Move recipes onto the same composition command and label their global scope explicitly.
5. Spike complete usage aggregation across global triggers and all project rundowns; ship the count only if the bounded
   scan is cheap and does not widen persisted state.
6. Verify refresh, error recovery, disabled-automation behavior, responsive layout, and representative recipes.

## Pull request boundaries

### PR 1 includes

- Definition-only create/edit behavior and rejection of trigger fields at that boundary.
- Reference-safe deletion behavior and tests for global/event usages.
- Output cards, output summaries, test feedback, shared lifecycle labels, and trigger clarity.
- Template-aware OSC/HTTP validation.
- The minimum shared scrolling changes required by these screens.

### PR 1 excludes

- Recipe catalog or recipe picker.
- Composer API or UI.
- Lifecycle fields on automation definitions.
- Trigger reconciliation in definition CRUD.
- Usage counts.
- Event-scoped recipes.

### PR 2 includes

- A dedicated composition contract and atomic global creation path.
- Manual and recipe-driven composition using the same path.
- Definition-only save as an explicit composer option.
- Complete usage counts only if the aggregation spike meets the cost constraint.

### PR 2 excludes

- Event-scoped recipes or an event composer.
- Persisted usage counters.
- Trigger schema/title migration.
- Editing shared definitions through trigger rows.
- A general workflow engine.

## Verification gates

PR 1 must pass focused and full client/server automation tests, client/server type checks and lint, formatting, builds,
diff hygiene, and the browser smoke check. PR 2 repeats those gates and adds tests for atomicity, duplicate lifecycle
inputs, manual creation, recipe creation, failed-save retry, and any usage aggregation that ships.

Detailed progress is tracked in `tasks/automation-composer-todo.md`; the unrelated teleprompter plan in
`tasks/todo.md` remains untouched.
