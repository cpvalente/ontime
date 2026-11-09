import type { EntryId, MaybeString, OntimeEntry } from 'ontime-types';
import { isOntimeEvent, isPlayableEvent } from 'ontime-types';

export type LinkToLoaded = {
  totalGap: number; // gaps accumulated since the loaded event
  isLinkedToLoaded: boolean; // whether an unbroken link chain reaches back to the loaded event
};

/**
 * Walks the playable events from the loaded event, accumulating gaps and following the link chain
 * - the order may hold any entries, only playable events after the loaded one are walked
 * - a countToEnd event ends on its planned time: it breaks the chain and gives its duration back as gap
 * - the loaded event's own countToEnd is already accounted for in the runtime offset
 * - with nothing loaded, every playable event is walked and none is linked
 * @returns the loaded event and each playable event after it
 */
export function getLinksToLoaded(
  entries: Readonly<Record<EntryId, OntimeEntry>>,
  order: readonly EntryId[],
  loadedId: MaybeString,
): Map<EntryId, LinkToLoaded> {
  const links = new Map<EntryId, LinkToLoaded>();
  const loadedIndex = loadedId === null ? -1 : order.indexOf(loadedId);
  if (loadedId !== null && loadedIndex === -1) {
    return links;
  }

  let totalGap = 0;
  let isLinkedToLoaded = loadedId !== null;
  let previousCountToEndDuration: number | null = null;

  if (loadedId !== null) {
    links.set(loadedId, { totalGap, isLinkedToLoaded });
  }

  for (let i = loadedIndex + 1; i < order.length; i++) {
    const entry = entries[order[i]];
    if (!isOntimeEvent(entry) || !isPlayableEvent(entry)) {
      continue;
    }

    if (previousCountToEndDuration !== null) {
      totalGap += entry.gap + previousCountToEndDuration;
      isLinkedToLoaded = false;
    } else {
      totalGap += entry.gap;
      isLinkedToLoaded = isLinkedToLoaded && entry.linkStart;
    }

    previousCountToEndDuration = entry.countToEnd ? entry.duration : null;
    links.set(entry.id, { totalGap, isLinkedToLoaded });
  }

  return links;
}
