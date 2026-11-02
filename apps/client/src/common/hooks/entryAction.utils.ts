import { EntryId, OntimeEntry, Rundown, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';

/**
 * Applies a patch the way the server does, revision included,
 * so the optimistic entry matches the one the server returns.
 * Mirrors hasChanges and applyPatchToEntry in the rundown service.
 */
export function patchEntry(entry: OntimeEntry, patch: Partial<OntimeEntry>): OntimeEntry {
  if (!hasChanges(entry, patch)) {
    return entry;
  }
  if (isOntimeEvent(entry) || isOntimeGroup(entry) || isOntimeMilestone(entry)) {
    const { custom, ...rest } = patch as Partial<typeof entry>;
    // a patch names only the custom fields it changes
    return { ...entry, ...rest, custom: { ...entry.custom, ...custom }, revision: entry.revision + 1 } as OntimeEntry;
  }
  return { ...entry, ...patch } as OntimeEntry;
}

function hasChanges(entry: OntimeEntry, patch: Partial<OntimeEntry>): boolean {
  return Object.keys(patch).some(
    (key) => !Object.hasOwn(entry, key) || entry[key as keyof OntimeEntry] !== patch[key as keyof Partial<OntimeEntry>],
  );
}

/**
 * Whether a rundown from the server predates the one we hold.
 * An optimistic rundown carries revision -1, so a response always supersedes it.
 */
export function isStaleRundown(cachedRundown: Rundown | undefined, incomingRevision: number): boolean {
  return cachedRundown !== undefined && incomingRevision < cachedRundown.revision;
}

/**
 * Removes entries from a rundown for an optimistic cache update, without mutating the given rundown.
 * Mirrors the server: deleting a group deletes its children, unknown ids are ignored.
 */
export function optimisticDeleteEntries(entryIds: EntryId[], rundown: Rundown) {
  const entries = { ...rundown.entries };
  const removed = new Set<EntryId>();

  for (const id of entryIds) {
    const entry = entries[id];
    if (!entry) continue;

    if (isOntimeGroup(entry)) {
      for (const childId of entry.entries) {
        delete entries[childId];
        removed.add(childId);
      }
    } else if (entry.parent) {
      const parent = entries[entry.parent];
      if (parent && isOntimeGroup(parent)) {
        entries[parent.id] = patchEntry(parent, { entries: parent.entries.filter((childId) => childId !== entry.id) });
      }
    }

    delete entries[entry.id];
    removed.add(entry.id);
  }

  const order = rundown.order.filter((id) => !removed.has(id));
  const flatOrder = rundown.flatOrder.filter((id) => !removed.has(id));

  return { entries, order, flatOrder };
}
