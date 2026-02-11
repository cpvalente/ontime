import { OntimeEvent, OntimeLoading } from 'ontime-types';

import { ExtendedEntry } from '../../../common/utils/rundownMetadata';

// Display time chips for current + next 5 upcoming events
const UPCOMING_CHIP_COUNT = 5;

export function getCurrentEventInfo(data: ExtendedEntry<OntimeEvent | OntimeLoading>[]) {
  const index = data.findIndex((entry) => entry.isLoaded);
  const event = index !== -1 ? data[index] : null;
  const eventIndex = (event as ExtendedEntry<OntimeEvent>)?.eventIndex ?? 0;

  return {
    index,
    id: event?.id ?? null,
    eventIndex,
    upcomingChipLimit: eventIndex > 0 ? eventIndex + UPCOMING_CHIP_COUNT : UPCOMING_CHIP_COUNT,
  };
}
