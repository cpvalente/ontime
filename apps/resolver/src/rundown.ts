import { isOntimeEvent, OntimeEntry, OntimeEvent, Rundown } from 'ontime-types';

export function getFlatRundown(rundown: Rundown, eventsOnly: true): OntimeEvent[];
export function getFlatRundown(rundown: Rundown, eventsOnly: false): OntimeEntry[];
export function getFlatRundown(rundown: Rundown, eventsOnly: boolean) {
  const { flatOrder, entries } = rundown;
  let idx = 0;
  if (eventsOnly) {
    const flatRundown = new Array<OntimeEvent>(flatOrder.length);
    for (const id of flatOrder) {
      const entry = entries[id];
      if (!isOntimeEvent(entry)) continue;
      flatRundown[idx] = entry;
      idx++;
    }
    return flatRundown;
  } else {
    const flatRundown = new Array<OntimeEntry>(flatOrder.length);
    for (const id of flatOrder) {
      const entry = entries[id];
      flatRundown[idx] = entry;
      idx++;
    }
    return flatRundown;
  }
}
