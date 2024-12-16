import { calculateExpectedStart } from 'ontime-utils';

import useRundown from '../hooks-query/useRundown';

import { useTimeUntilData } from './useSocket';

export default function useTimeUntil() {
  const { data: rundownCached } = useRundown();
  const { offset, clock, selectedEventIndex } = useTimeUntilData();

  return calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex);
}
