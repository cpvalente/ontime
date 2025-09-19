import { OntimeEvent } from 'ontime-types';
import { ExtendedEntry } from './rundownMetadata';
import { getExpectedStart } from 'ontime-utils';
import { useExpectedTimeSocket } from '../hooks/useSocket';

export function useExpectedTime(
  event: Pick<
    ExtendedEntry<OntimeEvent>,
    'timeStart' | 'dayOffset' | 'delay' | 'totalGap' | 'isLinkedToLoaded' | 'duration' | 'countToEnd' | 'timeEnd'
  >,
): { timeStart: number; timeEnd: number } {
  const { currentDay, offset, mode, actualStart, plannedStart } = useExpectedTimeSocket();

  const expectedStart = getExpectedStart(event, {
    currentDay,
    totalGap: event.totalGap,
    isLinkedToLoaded: event.isLinkedToLoaded,
    offset,
    mode,
    actualStart,
    plannedStart,
  });

  //TODO: count to end
  const timeEnd = event.countToEnd ? event.timeEnd : expectedStart + event.duration;

  return { timeStart: expectedStart, timeEnd };
}
