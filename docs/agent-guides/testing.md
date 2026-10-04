# Testing strategy

Use for changed behaviour or tests.

## Layers

### Pure unit

Put detailed business-rule coverage on pure functions. Test public inputs/outputs with Vitest: relevant boundaries, invalid input, ordering, rollover, errors.

Every bug fix needs a regression test that fails before the fix. Prefer behaviour over mocks/implementation assertions.

### Service and state

Use service, DAO, store, or hook tests for orchestration: transitions, transactions, persistence, cache, notifications, external effects.

Do not repeat all pure cases here. Prove delegation and sequencing.

### Server integration

Use `startTestServer()` (`apps/server/src/__tests__/testServer.ts`) for server behaviour that only shows across layers: HTTP or integration API through services to runtime state and persistence. It runs the real server in-process on a free port against the test file's data folder; `stop()` is a clean shutdown and starting again behaves like an app restart.

Name files `*.integration.test.ts`. One test per product behaviour; keep edge cases in lower layers. Mock only outbound edges, never Ontime modules.

### End-to-end

Reserve Playwright for key journeys and high-risk cross-layer integrations: edit/run rundown, playback, imports, rundown switching, cloud-prefixed navigation.

No E2E for edges already proven in lower layers. Add E2E only when lower layers cannot prove the user-facing integration.

Import `test`/`expect` from `e2e/tests/fixtures/override`; it fails tests on uncaught page errors. Specs share the main server: leave its state (timers, playback, settings) as found. The password spec uses its own server.

## Compact before handoff

Development harnesses may be broad, repetitive, diagnostic, temporary. Before handoff:

1. Identify distinct required behaviours/regressions.
2. Keep the smallest readable set that catches them.
3. Parameterise repetition only when the table reads better.
4. Remove diagnostic assertions, redundant permutations, temporary fixtures, private-detail coupling.
5. Keep rare cases that encode real domain rules.

Optimise for future readers, not minimum line count.

## Quality

- Name tests by observable behaviour.
- Keep setup local/explicit unless a fixture improves comprehension.
- Avoid arbitrary waits, wall-clock dependence, cross-test state, weak assertions.
- Server test files each get a temporary data folder through `ONTIME_DATA` (`apps/server/vitest.setup.ts`); never read or write the user's real data folder.
- Prefer realistic typed fixtures over large snapshots or masking casts.
- Test non-mutation when promised.
- No tests for trivial type/format changes or framework behaviour Ontime does not own.

## Review prompts

- Business logic directly unit-testable?
- Test catches the reported bug/regression?
- Cases distinct, not repeated path?
- Temporary harness leaked?
- E2E justified by cross-layer risk?
