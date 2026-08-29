import { EntryId, MaybeString } from 'ontime-types';
import { useCallback } from 'react';

import { useRundownScope } from '../../common/context/RundownScopeContext';
import { useCollapsedGroups } from './useCollapsedGroups';
import { useEventSelection } from './useEventSelection';

type SelectAndRevealOptions = {
  id: EntryId;
  index: number;
  parent?: MaybeString;
};

export function useSelectAndRevealEntry() {
  const { rundownId } = useRundownScope();
  const { expandGroup } = useCollapsedGroups(rundownId);
  const selectEntry = useEventSelection((state) => state.setSelectedEvents);
  const scrollToEntry = useEventSelection((state) => state.scrollToEntry);

  return useCallback(
    ({ id, index, parent }: SelectAndRevealOptions) => {
      expandGroup(parent);
      selectEntry({ id, index, selectMode: 'click' });
      // Wait one frame so collapsed-group expansion is reflected in rendered/visible entries before scrolling.
      requestAnimationFrame(() => {
        scrollToEntry(id);
      });
    },
    [expandGroup, scrollToEntry, selectEntry],
  );
}
