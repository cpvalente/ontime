import { EntryId, OntimeEvent, RundownEntries, isOntimeEvent } from 'ontime-types';

/**
 * Applies a patch to a set of events, used to optimistically resolve a batch edit
 * Entries which are missing or are not events are left untouched, mirroring the server
 * @returns a new entries object, the given entries are not mutated
 */
export function applyPatchToEvents(
  entries: RundownEntries,
  ids: EntryId[],
  patch: Partial<OntimeEvent>,
): RundownEntries {
  const patchedEntries = { ...entries };

  for (const id of new Set(ids)) {
    const entry = patchedEntries[id];
    if (!isOntimeEvent(entry)) {
      continue;
    }

    patchedEntries[id] = {
      ...entry,
      ...patch,
      // custom fields are patched, not replaced
      custom: patch.custom ? { ...entry.custom, ...patch.custom } : entry.custom,
    };
  }

  return patchedEntries;
}

/**
 * Whether the result of a batch edit can be resolved without the server
 * Changing the duration cascades through the rundown, so the resulting
 * schedule is only known once the server has recalculated it
 */
export function canPredictBatchResult(patch: Partial<OntimeEvent>): boolean {
  return !('duration' in patch);
}
