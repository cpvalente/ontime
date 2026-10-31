import { EntryId, OntimeEntry } from 'ontime-types';

/**
 * Resolves which entry the editor should show for the current selection
 * - the cursor, if it is part of the selection and still exists
 * - otherwise the first selected entry that still exists
 */
export function getEditTarget(
  selectedEvents: Set<EntryId>,
  cursor: EntryId | null,
  entries: Record<EntryId, OntimeEntry>,
): OntimeEntry | null {
  if (cursor && selectedEvents.has(cursor) && entries[cursor]) {
    return entries[cursor];
  }

  for (const id of selectedEvents) {
    if (entries[id]) {
      return entries[id];
    }
  }

  return null;
}
