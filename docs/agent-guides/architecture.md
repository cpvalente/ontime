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

### Model

- Vertical slices: each `api-data/<resource>/` matches its route and holds its router, validation, service, DAO, utils, tests. Keep folder names aligned with routes.
- Aggregates own data and invariants. Rundown owns entries, groups, custom fields; the project is the unit of persistence. Other slices (excel, sheets, report, custom-fields, MCP, integrations) go through the owner's service or DAO, never its state.
- Functional core, imperative shell: pure utils and parsers decide; services orchestrate effects in visible order.
- Adapters at the edge: `adapters/` and `api-integration/` translate inbound protocols; `automation/clients/` handle outbound ones.
- Runtime is a clock-driven context in `services/runtime-service/`: state machine (`stores/runtimeState`), ticker (`tickingTimer`, no runtime knowledge), service shell (`runtime.service`). The service starts the ticker in `init()`, applies each tick to runtime state; its commands change runtime state directly, and its `broadcastResult` decorator is the only place that reschedules the next boundary. Rundown notifies runtime of changes; runtime reads rundown through its DAO.

### Layout

| Location                   | Holds                                      |
| -------------------------- | ------------------------------------------ |
| `api-data/<resource>/`     | One route slice; nothing else              |
| `services/<name>-service/` | One service with its helpers and tests     |
| `stores/`                  | Mutable runtime state                      |
| `adapters/`                | Inbound protocol adapters                  |
| `middleware/`              | Express middleware shared across routers   |
| `lib/`                     | Self-contained libraries (eg: `time-core`) |
| `utils/`                   | Generic, domain-free helpers               |

| File suffix                        | Role                                                             |
| ---------------------------------- | ---------------------------------------------------------------- |
| `.router.ts`, `.controller.ts`     | HTTP edge: map requests to service calls                         |
| `.validation.ts`, `.middleware.ts` | Guard the boundary, next to the resource                         |
| `.service.ts`                      | Shell: orchestrate persistence, broadcast, runtime notifications |
| `.dao.ts`                          | Shell: persistence and cache                                     |
| `.utils.ts`, `.parser.ts`          | Core: pure, inputs passed explicitly                             |
| `.types.ts`                        | Local types                                                      |

Name files `name.role.ts`. Keep tests in a sibling `__tests__/`.

Known gaps, not precedent: `runtimeState` reads the clock and mutates a module singleton; some routers call `DataProvider` directly; `rundown.service` writes runtime state without going through `runtime.service`.

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

Rundown data has two sources. Editing surfaces mount `RundownScopeProvider` and read data, selection, and entry actions from that scope (`useRundown`, `useEventSelection`, `useEntryActionsContext`). Runtime-only surfaces use the `useLoaded*` hooks. Runtime state (playing event, playback) applies only when the scope `isLoaded`. Mutations resolve their cache key from the rundown ID they were sent with, never from the current scope. Rows of virtualised lists receive entry data as props from the list and never call rundown query hooks, since each mount would refetch the rundown.

Limit subscriptions with selectors. Keep effect dependencies stable. Clean up listeners, intervals, external resources.
Preserve previous Zustand snapshots when patching state so selectors and subscriptions can detect changes.

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
