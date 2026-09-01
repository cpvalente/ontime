---
name: code-review
description: Review Ontime changes for concrete correctness, architecture, testing, routing, security, and maintenance issues. For GitHub Copilot review.
---

# Review Ontime changes

Review as a maintainer. Find material defects, not speculative advice, style preferences, or generic checklists. Approve when no material issue remains.

## Load relevant context

Read the full diff, PR description, linked issue, tests, and nearby owning code. Then load only applicable guides:

- Every non-trivial review: [change assessment](../../../docs/agent-guides/change-assessment.md)
- Module placement, server layers, client state, shared packages: [architecture](../../../docs/agent-guides/architecture.md)
- Tests or changed behaviour: [testing](../../../docs/agent-guides/testing.md)
- Comments, abstractions, naming, complexity: [code quality](../../../docs/agent-guides/code-quality.md)
- Authentication, external input, files, integrations, assets, secrets: [security](../../../docs/agent-guides/security.md)
- Routes, URLs, websockets, authentication, cookies, presets, assets: [routing and cloud](../../../docs/agent-guides/routing-and-cloud.md)
- Rundowns, timers, persistence, imports, cache, realtime: [domain invariants](../../../docs/agent-guides/domain-invariants.md)
- Commands, imports, dependencies, formatting, CI claims: [workflow](../../../docs/agent-guides/workflow.md)

Check a guide and nearby canonical code before citing an Ontime convention. Skip unrelated guides.

## Review order

1. Establish intent and affected runtime surfaces.
2. Read tests first. Identify claimed behaviour and coverage.
3. Trace implementation, errors, and state transitions.
4. Check correctness/data integrity, security, architecture/testability, cloud routing, lifecycle/performance, maintainability.
5. Verify claimed checks. Never claim unobserved results.

Passing tests do not prove architecture, routing, comments, or error paths. Review changed behaviour only; include existing problems only when the diff worsens or relies on them.

## Findings

Report only concrete, actionable issues. Each finding: tight line range, direct defect, impact and trigger, smallest viable remedy when unclear.

- **P0 — Critical:** data loss, exploitable vulnerability, broadly broken production. Blocks merge.
- **P1 — High:** likely correctness failure or major supported-deployment regression. Blocks merge.
- **P2 — Medium:** real edge-case defect, architecture regression, missing business-rule test, stale comment, meaningful maintenance risk. Normally blocks merge.
- **P3 — Low:** local improvement with limited impact. No subjective style or tool-managed formatting.

Order by priority. Prefer few high-confidence findings. No praise or checklist before findings. If none, say so and note verification gaps or residual risk.

Then give one concise PR-level value/risk/complexity assessment. Never repeat it per finding.
