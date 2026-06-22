# Ontime Sync Engine — Backend Plan

> Status: **draft / requirements**. Scope: backend only. The client/UI integration is
> deliberately out of scope and will be specified separately.

## 1. Goal

Run **two independent Ontime backends** (typically one **local** and one in the **cloud**) and
keep them in sync:

- The user, from the client of *one* backend, initiates a sync between the two.
- After the initial sync, both backends hold the **same project data**.
- Ongoing **data changes** (rundown edits, custom fields, settings, …) propagate to both.
- Ongoing **playback actions** (start / stop / pause / roll / load / add-time, messages,
  aux timers) propagate to both, so both report the same runtime state.

The brief suggests leaning on a CRDT library (Automerge / `automerge-repo`) to do the heavy
lifting. This document validates that idea against the codebase and proposes a concrete
architecture.

## 2. What the code actually looks like (validated)

There are **three distinct kinds of state** in the server, and they have very different sync
requirements. This distinction drives the whole design.

### 2.1 Persistent project data — *the document*

`DatabaseModel` (`packages/types/src/definitions/DataModel.type.ts`):

```ts
type DatabaseModel = {
  rundowns: ProjectRundowns;   // Record<RundownId, Rundown>
  project: ProjectData;
  settings: Settings;
  viewSettings: ViewSettings;
  urlPresets: URLPreset[];
  customFields: CustomFields;
  automation: AutomationSettings;
};
```

- Persisted by `DataProvider` (`apps/server/src/classes/data-provider/DataProvider.ts`) via
  **lowdb** to a JSON file, with a **3 s trailing-edge debounced write** (`persist()`).
- A `Rundown` carries `{ id, title, order, flatOrder, entries, revision }`. `entries` is a
  `Record<EntryId, OntimeEntry>` — i.e. a map keyed by stable id. `order`/`flatOrder` are
  arrays of ids.
- This is **collaborative-document-shaped data**. It is the natural fit for a CRDT.

### 2.2 Rundown cache + transaction layer

`apps/server/src/api-data/rundown/rundown.dao.ts`:

- The **currently loaded** rundown lives in an in-memory `cachedRundown` plus derived
  `rundownMetadata` (computed schedule: gaps, delays, group times, ordered lists).
- All edits go through `createTransaction({ rundownId, mutableRundown })` →
  `rundownMutation.*` (add/edit/remove/reorder/applyDelay/swap/clone/group/ungroup/renumber)
  → `commit()`. `commit()`:
  1. bumps `cachedRundown.revision`,
  2. re-processes derived metadata (`processRundown`),
  3. persists through `DataProvider.setRundown`.
- **Non-loaded ("background") rundowns** bypass the cache: read from disk, mutate, persist.
- `rundown.service.ts` wraps every mutation and, in a `setImmediate`, fires **side effects**:
  - `updateRuntimeOnChange()` → pushes derived counts into runtime state,
  - `notifyChanges()` → `runtimeService.notifyOfChangedEvents()` (timer) and
    `sendRefetch(RefetchKey.Rundown, revision, rundownId)` (tells clients to re-pull).

> Key takeaway: **mutations are funnelled through a single, well-defined chokepoint** with a
> post-commit side-effect hook. That hook is exactly where remote (synced) changes must also
> be injected, so that a change arriving from the peer triggers the same cache rebuild +
> client refetch as a local edit.

The other persistent slices (`project`, `settings`, `viewSettings`, `urlPresets`,
`customFields`, `automation`) are written **directly** through `DataProvider` setters and do
**not** go through the transaction/side-effect layer — they emit their own `Refetch` from
their routers. Sync must cover these too.

### 2.3 Runtime / playback state — *not document data*

`apps/server/src/stores/runtimeState.ts` + `EventTimer` + `runtime.service.ts`:

- Live timer state is **derived every tick from the local wall clock** (`timeCore.now()` =
  `Date.now()`), recomputed at 30 fps and broadcast to clients at ~1 fps via `eventStore`
  over the websocket (`MessageTag.RuntimeData`).
- The **entire playback state collapses to a tiny serialisable record** — the existing
  `RestorePoint` (`services/restore-service/restore.type.ts`):

  ```ts
  type RestorePoint = {
    playback: Playback;
    selectedEventId: MaybeString;
    startedAt: MaybeNumber;     // TimeOfDay (ms since local midnight)
    addedTime: number;
    pausedAt: MaybeNumber;      // TimeOfDay
    firstStart: MaybeNumber;    // TimeOfDay
    startEpoch: Maybe<Instant>; // absolute epoch ms  ← timezone independent
    currentDay: MaybeNumber;
  };
  ```

- `runtimeState.resume(restorePoint, event, rundown, metadata)` already **reconstructs a live
  playing timer from this record** — this is the mechanism a follower backend will reuse to
  adopt remote playback state.
- **Commands** (`start/startById/stop/pause/roll/load*/addTime/setOffsetMode`) all live on the
  `runtimeService` singleton, decorated with `@broadcastResult`. External callers reach them
  through `dispatchFromAdapter()` (`integration.controller.ts`) from WS/OSC/HTTP.
- **Messages** (`message.service.ts`) and **aux timers** (`AuxTimerService`) are additional
  ephemeral runtime state held in `eventStore`, not in the DB.

> Critical timing observation: `timeCore.toTimeOfDay()` uses the **machine's local timezone
> offset** (`getTimezoneOffset`). `startEpoch` is absolute and TZ-independent, but `startedAt`,
> `pausedAt`, `firstStart`, `clock` are all *TimeOfDay in the originating machine's TZ*. A
> local box and a cloud box in different timezones will **not** interpret a replicated
> TimeOfDay the same way. Playback sync must therefore anchor on **absolute epoch + the
> project's configured timezone**, and the follower must **recompute** TimeOfDay-derived
> fields locally rather than copying them verbatim.

## 3. Does a CRDT fit? — Verdict

**Yes, but only for §2.1 (the project document).** Automerge is a strong fit there:

- Edits are keyed by stable ids (`entries[id]`, `customFields[key]`, rundowns by id), so
  concurrent edits to *different* entries merge cleanly (Automerge maps merge per-key).
- It removes the need to hand-roll conflict resolution, op ordering, and incremental
  catch-up after disconnection.

**No for §2.3 (playback/runtime).** A CRDT is the wrong tool for real-time control:

- Timer ticks must **not** be streamed over the network — each backend already derives them
  locally from the wall clock. We only need to replicate **intent transitions**.
- Playback is a control-plane concern with a "last command wins" nature, not a mergeable
  document.

So the recommendation is a **hybrid**:

| Domain | Mechanism | Library |
| --- | --- | --- |
| Project document (`DatabaseModel`) | CRDT document, incremental sync | `@automerge/automerge-repo` + WS network adapter |
| Playback / messages / aux timers | Replicated **intent** (LWW register w/ logical clock), recomputed locally | small in-house module over the same socket |
| Live timer ticks | **Not synced** — derived locally on each node | existing `EventTimer` |

## 4. Topology & connection model

- **Initiation is directional, ongoing sync is bidirectional.** "Sync now" from backend A
  must choose a **baseline owner** (whose project seeds the shared document). Merging two
  *unrelated* projects with a CRDT yields a union of both rundowns — almost never what the
  user wants. So:
  1. On "sync", A and B establish a connection.
  2. The chosen baseline (say A) exports its current project as the shared Automerge document;
     B **adopts** it (forks from A's document so they share lineage/history).
  3. From then on, both edit the *same* document and `automerge-repo` reconciles incrementally
     and bidirectionally.
- **Who dials whom:** the cloud instance (`IS_CLOUD`) has a reachable public endpoint; the
  local instance is usually behind NAT. The **local node dials out to the cloud node**, and
  the cloud node acts as the `automerge-repo` sync server / relay. This is exactly the
  `automerge-repo` WebSocket server/client split.
- **Sync targets the currently loaded project only** (one Automerge `DocumentId` ↔ one Ontime
  project). Switching projects detaches/attaches the sync session.
- **Auth:** the sync socket must authenticate. Reuse the existing auth (`makeAuthenticateMiddleware`
  / login flow + shared token). The "sync" action carries the peer URL + credentials.

## 5. Integration points (where code hooks in)

1. **DataProvider becomes CRDT-backed (the document).**
   - The shared Automerge doc holds the persistent `DatabaseModel`.
   - `DataProvider` read paths return the doc's current value; write paths (`setRundown`,
     `setCustomFields`, `setSettings`, …) are re-expressed as Automerge `change()` calls.
   - Granularity: the existing mutations already operate at **per-entry / per-key** level
     (`rundown.entries[id] = …`, `order.splice(...)`, `customFields[key] = …`). Re-expressing
     them as Automerge changes at that same granularity gives good merge behaviour without a
     full rewrite of the mutation algorithms. **Avoid replacing whole `entries`/`order`
     objects wholesale** — that defeats per-key merge. The current `commit()` reassigns
     `cachedRundown.entries = entries`; the CRDT adapter needs to apply the *delta* instead.
   - lowdb persistence stays as a **local durability layer** (or is replaced by Automerge's
     own storage adapter). Either way the 3 s debounce semantics should be preserved.

2. **Remote-change observer → existing side-effect path.**
   - Subscribe to Automerge doc changes. When a change arrives **from the peer** (not from a
     local mutation), run the same post-commit side effects that a local edit would:
     - rebuild the loaded-rundown cache (`rundownCache.init` / `runtimeState.updateAll`),
     - `runtimeService.notifyOfChangedEvents(metadata)`,
     - `sendRefetch(RefetchKey.Rundown | …, revision, rundownId)` to local clients.
   - This is the single most important hook: it makes remote edits indistinguishable from
     local edits to everything downstream (clients, timer, integrations).

3. **`revision` semantics.** Today `revision` is a per-rundown monotonic counter used only to
   tell clients "you're stale, refetch". With two writers it can collide. Options: derive the
   client-facing revision from the Automerge document heads/hash, or keep the counter as
   advisory and rely on the refetch always pulling current truth. Recommend deriving a stable
   version token from Automerge heads.

4. **Playback intent channel.**
   - Define a replicated `PlaybackIntent` ≈ `RestorePoint` + `offsetMode`, plus `messages` and
     `auxTimers[1..3]` intent (`{playback, startedAtEpoch, duration, direction}`).
   - Model as a **LWW register stamped with a logical (Lamport) clock + originating peer id**.
     Every `runtimeService` command updates the local intent and publishes it; the peer
     applies it if its stamp is newer.
   - The follower applies intent via a **resume-style path** (`runtimeState.resume`-like) that
     **recomputes TimeOfDay fields from `startEpoch` + clock offset + project timezone** — it
     does *not* copy `startedAt`/`pausedAt` verbatim (see §2.3 timing note).
   - Live ticks remain local; both nodes converge because they share intent + a common clock.

5. **Clock synchronisation.**
   - Both nodes must agree on epoch time within tolerance (target sub-100 ms for broadcast use).
   - Recommend an **application-level offset estimate** over the sync socket (periodic
     timestamped ping ⇒ Cristian's algorithm / NTP-lite), applied by the follower when
     interpreting `startEpoch`. Do not assume both machines are NTP-disciplined, but benefit
     from it when they are.

## 6. Conflict & authority model

- **Document edits:** resolved by Automerge (per-key map merge, RGA for arrays). Define a
  policy for the rare same-key concurrent edit (Automerge picks a deterministic winner; we
  may surface a "changed remotely" hint to the editor). Concurrent reorders of the same list
  are the main thing to test (array CRDT semantics).
- **Playback:** a human operator drives it; genuinely simultaneous conflicting commands are
  rare. LWW on the intent register (logical clock + peer id tiebreak) is sufficient for a
  2-node system and far simpler than a leader-election protocol. Revisit if N>2 is ever needed.

## 7. Phased delivery

1. **Phase 0 — Spec & spike.** Lock requirements (this doc). Spike `automerge-repo` WS
   client/server between two local server instances; prove a doc round-trips.
2. **Phase 1 — Document sync (data only).** CRDT-back the `DatabaseModel`; remote-change
   observer wired into the existing refetch/cache side-effect path. Directional initial seed.
   No playback sync yet. Deliverable: edits on either node appear on both.
3. **Phase 2 — Clock sync + playback intent.** Offset estimation; replicate `PlaybackIntent`;
   follower derives ticks locally. Deliverable: start/stop/pause/roll/load/add-time mirror.
4. **Phase 3 — Messages & aux timers.** Extend intent channel.
5. **Phase 4 — Resilience.** Reconnection/catch-up, project-switch handling, auth hardening,
   conflict UX hints, observability (drift metrics, sync status).

## 8. Open questions / decisions needed

1. **Library:** confirm `@automerge/automerge-repo` (WASM core) vs alternatives (Yjs). Automerge
   matches the keyed-map data model and brittle-free merges; Yjs is leaner/faster but more
   text-CRDT oriented. *Recommendation: Automerge.*
2. **Baseline-owner UX:** when the two projects differ at initiation, is it always
   "push mine / overwrite theirs", or do we offer "pull theirs"? (Merging unrelated projects is
   explicitly discouraged.)
3. **Persistence:** keep lowdb as the local store and treat Automerge as the in-memory
   sync truth, or move durability to an Automerge storage adapter? Affects crash recovery and
   the existing `flushPendingWrites`/restore flow.
4. **Timezone authority:** anchor playback on the **project's configured timezone** (not each
   machine's local TZ). Confirm where that timezone lives / whether it must be added.
5. **`report` data** (run history): sync as part of the document, or keep per-instance?
6. **Scope of N:** is 2 nodes the hard ceiling, or should the intent/authority model leave room
   for more peers?
7. **Multiple loaded rundowns / background rundowns:** confirm the whole project document syncs
   (all rundowns), while only the *loaded* one drives the runtime on each node.

## 9. Risks

- **TimeOfDay vs absolute epoch** across timezones (the single biggest playback-sync trap; §2.3).
- **Array/order merge** semantics for concurrent reorders — needs explicit test coverage.
- **`structuredClone`-and-replace** mutation style must be converted to deltas or it will
  clobber concurrent edits and negate the CRDT.
- **Document growth / compaction** — Automerge history grows; plan periodic compaction/snapshots.
- **Bandwidth on the local↔cloud link** — fine for doc deltas + intent; would be a problem if
  timer ticks were ever streamed (they must not be).
```
