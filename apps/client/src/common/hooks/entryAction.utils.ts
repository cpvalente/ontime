import { OntimeEntry, Rundown, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';

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
