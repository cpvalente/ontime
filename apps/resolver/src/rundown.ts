import { isOntimeEvent, OntimeEntry, OntimeEvent, Rundown } from 'ontime-types';

export function getFlatRundown<T extends true | false, O = T extends true ? OntimeEvent : OntimeEntry>(
  rundown: Rundown,
  eventsOnly: T,
): O[] {
  const { flatOrder, entries } = rundown;
  const flatRundown = new Array(flatOrder.length);
  let idx = 0;
  if (eventsOnly) {
    for (const id of flatOrder) {
      const entry = entries[id];
      if (!isOntimeEvent(entry)) continue;
      flatRundown[idx] = entry;
      idx++;
    }
  } else {
    for (const id of flatOrder) {
      const entry = entries[id];
      flatRundown[idx] = entry;
      idx++;
    }
  }

  return flatRundown;
}

