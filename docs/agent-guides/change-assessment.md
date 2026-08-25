# Change assessment

Use before non-trivial planning/implementation and during non-trivial review. Let it shape scope and verification; avoid process theatre.

## Rate three dimensions

- **Value** — concrete user, product, operational, or maintenance benefit; include urgency.
- **Risk** — regression likelihood/impact: data loss, security, cloud incompatibility, disruption, hard rollback.
- **Complexity** — concepts, dependencies, layers, states, verification surfaces; not line count.

Use `Low`, `Medium`, or `High`. Give one evidence-based sentence each. No pseudo-precise scores.

```markdown
## Assessment

- Value: High — <concrete benefit>
- Risk: Medium — <failure modes and reversibility>
- Complexity: Low — <conceptual and verification burden>
- Recommendation: Proceed | Reshape | Defer — <why>
```

One assessment per overall change.

- High value never excuses unmanaged risk/complexity.
- High risk needs earlier proof, narrower increments, rollback, or stronger checks.
- High complexity needs clearer boundaries and smaller steps, not automatic abstraction.
- Low value plus high risk/complexity suggests reshape or defer.
- Revise after material scope discovery.

Plans: assessment before steps. Reviews: findings first, then assessment. Assessment informs; never replaces user intent or evidence.
