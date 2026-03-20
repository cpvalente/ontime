import { useMemo } from 'react';

import useRundown from '../../../../common/hooks-query/useRundown';
import { useEventSelection } from '../../useEventSelection';

import { mergeEvents } from './multiEditUtils';

export function useMultiEventMerge() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();

  const merged = useMemo(
    () => mergeEvents(data.entries, selectedEvents, data.flatOrder),
    [data.entries, selectedEvents, data.flatOrder],
  );

  const selectedIds = useMemo(() => Array.from(selectedEvents), [selectedEvents]);

  return { merged, selectedIds, isMultiSelect: selectedEvents.size > 1 };
}
