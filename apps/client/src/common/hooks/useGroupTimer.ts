import type { MaybeNumber } from 'ontime-types';
import { useMemo } from 'react';

import useRundown from '../hooks-query/useRundown';
import { getRemainingGroupTime } from '../utils/groupTimer';
import { useGroupTimerData } from './useSocket';

export type GroupTimerState = {
  /** whether views should display the group timer instead of the event timer */
  isActive: boolean;
  /** time remaining in the group, mirrors the semantics of timer.current */
  current: MaybeNumber;
  /** time already spent in the group, mirrors the semantics of timer.elapsed */
  elapsed: MaybeNumber;
  /** scheduled duration of the group, used as the progress bar target */
  duration: MaybeNumber;
};

const inactiveGroupTimer: GroupTimerState = { isActive: false, current: null, elapsed: null, duration: null };

/**
 * Derives a shared timer for the running group.
 *
 * The value is the running event timer plus the content still scheduled after it,
 * which makes the group behave as if it were a single event containing all its children.
 * Deriving it from the event timer (instead of from the clock) means pause, added time,
 * overtime, roll and midnight rollovers are all inherited for free.
 */
export function useGroupTimer(): GroupTimerState {
  const { group, currentEventId, current } = useGroupTimerData();
  const { data: rundown } = useRundown();

  return useMemo(() => {
    if (!group?.useGroupTimer || currentEventId === null || current === null) {
      return inactiveGroupTimer;
    }

    // the loaded event could be outside the group while the group data is still settling
    if (!group.entries.includes(currentEventId)) {
      return inactiveGroupTimer;
    }

    const groupCurrent = current + getRemainingGroupTime(group, rundown.entries, currentEventId);

    return {
      isActive: true,
      current: groupCurrent,
      elapsed: Math.max(0, group.duration - groupCurrent),
      duration: group.duration,
    };
  }, [group, currentEventId, current, rundown.entries]);
}
