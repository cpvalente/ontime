# Workflow and repository conventions

Use for commands, imports, formatting, CI, dependencies, PRs.

## Workspaces

Confirm names from `package.json`.

| Package          | Workspace name        |
| ---------------- | --------------------- |
| Client           | `ontime-ui`           |
| Server           | `ontime-server`       |
| Electron         | `ontime-electron`     |
| Resolver         | `@getontime/resolver` |
| CLI              | `@getontime/cli`      |
| Shared types     | `ontime-types`        |
| Shared utilities | `ontime-utils`        |

Run from repo root: `pnpm --filter <workspace-name> <script>`. Add/install workspaces only when required.

## Verification

Start narrow; expand with risk:

```text
focused test
  -> affected package tests
  -> package lint/typecheck
  -> required repository checks
```

```bash
pnpm --filter ontime-ui test:pipeline <path-to-test>
pnpm --filter ontime-server test:pipeline <path-to-test>
pnpm --filter ontime-utils test:pipeline <path-to-test>
pnpm --filter <workspace-name> lint
pnpm --filter <workspace-name> typecheck

pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
```

PR CI: `.github/workflows/test.yml`; runs format, lint, types, unit, Playwright. Run E2E locally only for key flows or E2E infrastructure.

Before code commit: `pnpm lint`, `pnpm test`; add `pnpm typecheck` for TypeScript and `pnpm format:check` for formatted files. Claim only observed results.

## TypeScript and imports

- Strict TypeScript. Prefer `ontime-types` domain types over local copies.
- Keep client/server payloads aligned through `ontime-types`.
- Import `ontime-types`/`ontime-utils` from public entry points; Oxlint forbids `src` subpaths.
- Server relative ESM imports need `.js`.
- Reuse public exports/canonical helpers before adding utilities.

## Formatting and dependencies

- Use Oxlint/Oxfmt, not ESLint/Prettier.
- Oxfmt: two spaces, semicolons, single quotes, trailing commas, 120 columns.
- Add dependencies only when platform/current stack cannot solve the need. Review `package.json` and `pnpm-lock.yaml` together.
- Never hand-edit lockfile. No build output unless already tracked.

## Pull requests

- Title: `[<workspace-name>] <Title>`.
- Separate behaviour from unrelated refactors/format churn.
- State what changed, why, verification.
