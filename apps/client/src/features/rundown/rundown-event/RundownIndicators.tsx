import { useQueryClient } from '@tanstack/react-query';
import { Day, Rundown } from 'ontime-types';
import { useState } from 'react';
import { IoChevronBack, IoChevronDown, IoChevronForward } from 'react-icons/io5';

import { getRundownCacheKey } from '../../../common/api/constants';
import { DropdownMenu } from '../../../common/components/dropdown-menu/DropdownMenu';
import { useRundownScope } from '../../../common/context/RundownScopeContext';
import { getAdjacentDayStarts } from '../rundown.utils';
import { useSelectAndRevealEntry } from '../useSelectAndRevealEntry';
import { formatDelay, formatGap } from './rundownEvent.utils';

import style from './RundownIndicators.module.scss';

interface RundownIndicatorProps {
  timeStart: number;
  isNextDay: boolean;
  dayOffset: Day;
  delay: number;
  gap: number;
}

export default function RundownIndicators({ timeStart, delay, gap, isNextDay, dayOffset }: RundownIndicatorProps) {
  const gapLabel = formatGap(gap);
  const delayLabel = formatDelay(timeStart, delay);

  return (
    <div className={style.indicators}>
      {delayLabel && <div className={style.delay}>{delayLabel}</div>}
      {isNextDay && <DayMenu dayOffset={dayOffset} />}
      {gapLabel && <div className={style.gap}>{gapLabel}</div>}
    </div>
  );
}

/**
 * Names the day and navigates to the neighbouring days
 * The rundown is only read from the cache when the menu is used, so rows do not subscribe to it
 */
function DayMenu({ dayOffset }: { dayOffset: Day }) {
  const queryClient = useQueryClient();
  const { rundownId } = useRundownScope();
  const selectAndRevealEntry = useSelectAndRevealEntry();
  const [days, setDays] = useState<ReturnType<typeof getAdjacentDayStarts>>({ previous: null, next: null });

  const handleOpenChange = (open: boolean) => {
    const rundown = queryClient.getQueryData<Rundown>(getRundownCacheKey(rundownId));
    if (open && rundown) setDays(getAdjacentDayStarts(rundown, dayOffset));
  };

  return (
    // the menu renders in a portal, react still bubbles its clicks to the event row
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu
        className={style.dayTrigger}
        onOpenChange={handleOpenChange}
        items={[
          {
            type: 'item',
            label: 'Previous day',
            icon: IoChevronBack,
            disabled: !days.previous,
            onClick: () => days.previous && selectAndRevealEntry(days.previous),
          },
          {
            type: 'item',
            label: 'Next day',
            icon: IoChevronForward,
            disabled: !days.next,
            onClick: () => days.next && selectAndRevealEntry(days.next),
          },
        ]}
      >
        Day {dayOffset + 1}
        <IoChevronDown className={style.dayCaret} />
      </DropdownMenu>
    </div>
  );
}
