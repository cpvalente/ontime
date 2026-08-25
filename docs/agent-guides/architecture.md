# Ontime architecture

Use for module placement or cross-boundary changes.

## Direction

Dependencies point toward pure domain logic:

```text
HTTP request
  -> validation / router or controller
  -> service orchestration
  -> pure domain utilities

service orchestration
  -> DAO / stores / adapters / external clients
```

Keep a layer only for clearer ownership, isolated side effects, or direct business-rule tests.

## Reuse and ownership

Before adding a module, helper, service, or interface, find the concept owner and inspect callers.

1. Reuse when the contract already matches.
2. Extend for the same concept when the contract stays coherent.
3. Keep local when reuse needs flags, broad optional inputs, unrelated modes, or leaky terms.
4. Generalise only after stable common behaviour appears across real callers.

Do not duplicate canonical rules or distort an abstraction to force reuse. Small local duplication can beat coupling unrelated concepts.

## Server

### Routers and controllers

Routers declare paths and middleware. Controllers map validated HTTP input to typed service arguments, then results/errors to responses.

Keep reusable calculations, domain decisions, transformations, persistence workflows, and integration coordination out of handlers. Simple reads may stay direct when a service would only pass through.

### Services

Services orchestrate use cases and side-effect boundaries. Make ordering and effects visible. Move substantial branching, calculation, comparison, parsing, and transformation to pure utilities.

### Pure utilities

Pass required state, config, and time explicitly. No I/O, stores/globals, logging, websocket publication, browser inspection, or caller-owned mutation unless explicitly contracted.

Use focused Vitest coverage. Colocate feature logic. Move to `ontime-utils` only for genuine cross-package use.

### State and boundaries

- DAOs/data providers: persistence.
- Stores: mutable runtime state.
- Adapters/clients: external protocols and integrations.
- Validators/parsers: protect boundaries before domain logic.
- Commit state before dependent notifications or invalidations.

Old layering exceptions are context, not precedent. Improve touched boundaries only through focused, behaviour-preserving moves.

## Client

- `common/api`: HTTP transport.
- `common/hooks-query`: TanStack Query reads, mutations, keys, cache, invalidation.
- `features`: reusable product capabilities and domain behaviour.
- `views`: route-level composition.
- `common`: genuinely cross-feature code.

Keep substantial rules out of JSX, effects, and handlers. Use tested, colocated pure utilities. TanStack Query owns server state; established Zustand/context owns local state. No parallel caches.

Limit subscriptions with selectors. Keep effect dependencies stable. Clean up listeners, intervals, external resources.

## Shared packages

- `ontime-types`: shared contracts; type-focused.
- `ontime-utils`: environment-independent, side-effect-free shared logic.
- Never import application layers into shared packages.
- Keep feature-specific helpers with their owner, even when used by another file.

## Review prompts

- Business rule understandable/testable without app startup?
- Transport, orchestration, state, transformation separated?
- Existing owner reused without forcing unrelated behaviour?
- Abstraction removes concepts rather than relocating them?
- Smallest focused remedy clear?
