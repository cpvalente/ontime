import { MaybeNumber, OntimeEntry, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';

/**
 * Reads the revision of an entry, null when the entry type carries none.
 * Delays have no revision.
 */
export function entryRevision(entry: OntimeEntry | undefined): MaybeNumber {
  if (entry && (isOntimeEvent(entry) || isOntimeGroup(entry) || isOntimeMilestone(entry))) {
    return entry.revision;
  }
  return null;
}

/**
 * Applies a patch the way the server does, revision included.
 *
 * An entry revision advances on every change to that entry, which makes it a
 * cheap marker for whether an entry has moved on. The optimistic entry has to
 * carry the revision the server will return, otherwise the two disagree and the
 * refetch resolves to a different object for no reason.
 * Mirrors applyPatchToEntry in the rundown service: delays carry no revision.
 */
export function patchEntry(entry: OntimeEntry, patch: Partial<OntimeEntry>): OntimeEntry {
  if (isOntimeEvent(entry) || isOntimeGroup(entry) || isOntimeMilestone(entry)) {
    return { ...entry, ...patch, revision: entry.revision + 1 } as OntimeEntry;
  }
  return { ...entry, ...patch } as OntimeEntry;
}

/**
 * Whether an entry from the server supersedes what we hold.
 * Responses can land out of order, revisions only move forward.
 */
export function isStaleEntry(cachedEntry: OntimeEntry | undefined, incomingEntry: OntimeEntry): boolean {
  const cachedRevision = entryRevision(cachedEntry);
  const incomingRevision = entryRevision(incomingEntry);
  if (cachedRevision === null || incomingRevision === null) {
    return false;
  }
  return incomingRevision < cachedRevision;
}
