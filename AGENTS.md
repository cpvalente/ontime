# Ontime agent guide

Make the smallest maintainable change. Keep scope narrow. Inspect nearby code first. Reuse helpers and boundaries when semantics match.

## Load only relevant guides

- Commands, validation, formatting, imports, PRs: [workflow](docs/agent-guides/workflow.md).
- Non-trivial planning, implementation, review: [change assessment](docs/agent-guides/change-assessment.md).
- Module placement, server layers, client state, shared packages: [architecture](docs/agent-guides/architecture.md).
- Tests or changed behaviour: [testing](docs/agent-guides/testing.md).
- Comments, naming, abstractions, maintainability: [code quality](docs/agent-guides/code-quality.md).
- Authentication, external input, files, integrations, assets, secrets: [security](docs/agent-guides/security.md).
- Navigation, URLs, API paths, websockets, redirects, cookies, static assets: [routing and cloud](docs/agent-guides/routing-and-cloud.md).
- Rundowns, timers, imports, persistence, cache, websockets: [domain invariants](docs/agent-guides/domain-invariants.md).

Load multiple guides when needed. Skip unrelated guides for mechanical work.

## Before handoff

- Check the final diff for scope, stale comments, temporary code, redundant tests, generated files.
- If work reveals a missing, stable, reusable system, domain, or product invariant, update its owning guide. Exclude guesses, one-off bugs, and implementation details.
- Follow [workflow verification](docs/agent-guides/workflow.md). Report only observed results.
