import type { EntryId, OntimeEntry, OntimeGroup } from 'ontime-types';
import { isOntimeEvent, isPlayableEvent } from 'ontime-types';

/**
 * Calculates the amount of playable content remaining in a group
 * after (and excluding) the currently loaded event.
 *
 * The group timer treats the group as if it were a single event, so the displayed
 * value is the running event timer plus whatever is still scheduled after it.
 * Keeping this relative to the event timer means the group timer inherits pause,
 * added time, overtime and roll behaviour without duplicating any of that logic.
 *
 * The aggregation mirrors the group duration calculated in the server
 * (apps/server/src/api-data/rundown/rundown.dao.ts): non playable entries are
 * skipped and the gap is accounted for in every entry other than the first.
 */
export function getRemainingGroupTime(
  group: OntimeGroup,
  entries: Record<EntryId, OntimeEntry | undefined>,
  currentEventId: EntryId | null,
): number {
  if (currentEventId === null) {
    return 0;
  }

  const currentIndex = group.entries.indexOf(currentEventId);
  if (currentIndex === -1) {
    return 0;
  }

  let remaining = 0;

  for (let i = currentIndex + 1; i < group.entries.length; i++) {
    const entry = entries[group.entries[i]];
    if (!entry || !isOntimeEvent(entry) || !isPlayableEvent(entry)) {
      continue;
    }

    // the first entry of the group has no gap to account for,
    // any other entry could be preceded by idle time
    if (i > 0) {
      remaining += entry.gap;
    }
    remaining += entry.duration;
  }

  return remaining;
}
