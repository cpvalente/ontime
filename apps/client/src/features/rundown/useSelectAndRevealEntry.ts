import { EntryId } from 'ontime-types';
import { useCallback } from 'react';

import { useEventSelection } from './useEventSelection';

type SelectAndRevealOptions = {
  id: EntryId;
  index: number;
};

export function useSelectAndRevealEntry() {
  const selectEntry = useEventSelection((state) => state.setSelectedEvents);
  const scrollToEntry = useEventSelection((state) => state.scrollToEntry);

  return useCallback(
    ({ id, index }: SelectAndRevealOptions) => {
      selectEntry({ id, index, selectMode: 'click' });
      scrollToEntry(id);
    },
    [scrollToEntry, selectEntry],
  );
}
