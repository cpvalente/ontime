import { memo, useCallback } from 'react';
import { isOntimeLoading, OntimeEvent, OntimeLoading } from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import { formatDuration, useTimeUntilExpectedStart } from '../../../common/utils/time';
import { AppMode } from '../../../ontimeConfig';

import style from './TitleListItem.module.scss';

interface TitleListItemProps {
  entry: ExtendedEntry<OntimeEvent | OntimeLoading>;
  currentEventIndex: number;
  upcomingChipLimit: number;
  isRunning: boolean;
  mode: AppMode;
  isGroupEnd: boolean;
  onSelect: (params: { id: string; index: number; parent?: string }) => void;
}

export default memo(TitleListItem);
function TitleListItem({
  entry,
  currentEventIndex,
  upcomingChipLimit,
  isRunning,
  mode,
  isGroupEnd,
  onSelect,
}: TitleListItemProps) {
  const handleClick = useCallback(() => {
    if (isOntimeLoading(entry)) return;
    onSelect({ id: entry.id, index: entry.eventIndex - 1, parent: entry.parent ?? undefined });
  }, [onSelect, entry.id, entry.eventIndex, entry.parent, entry]);

  // Show "next" highlight for 2 events after current
  const isNext =
    currentEventIndex > 0 && entry.eventIndex > currentEventIndex && entry.eventIndex <= currentEventIndex + 2;
  const isPast = mode === AppMode.Run && entry.isPast;

  const state = (() => {
    if (isOntimeLoading(entry)) return 'default';
    if (entry.isLoaded) {
      return mode === AppMode.Run ? 'running' : 'selected';
    }
    if (isPast) return 'past';
    if (isNext) return 'next';
    return 'default';
  })();

  const isLoading = isOntimeLoading(entry);
  const shouldRenderChip =
    !isLoading && isRunning && !entry.isLoaded && !entry.isPast && !entry.skip;
  const showChipByDefault =
    !isLoading && shouldRenderChip && entry.eventIndex <= upcomingChipLimit;

  return (
    <li
      data-state={state}
      data-skipped={(!isLoading && entry.skip) || undefined}
      data-group-end={isGroupEnd || undefined}
      className={style.item}
      data-loading={isLoading || undefined}
      onClick={handleClick}
    >
      <div
        className={style.colourBar}
        style={{ backgroundColor: entry.groupColour || 'transparent' }}
      />
      <span className={style.title}>
        {isLoading ? 'Loading...' : (entry as OntimeEvent).title || 'Untitled'}
      </span>
      {shouldRenderChip && !isOntimeLoading(entry) && (
        <TitleListTimeUntilChip
          timeStart={entry.timeStart}
          delay={entry.delay}
          dayOffset={entry.dayOffset}
          totalGap={entry.totalGap}
          isLinkedToLoaded={entry.isLinkedToLoaded}
          isLoaded={entry.isLoaded}
          showOnHover={!showChipByDefault}
        />
      )}
    </li>
  );
}

interface TitleListTimeUntilChipProps {
  timeStart: number;
  delay: number;
  dayOffset: number;
  totalGap: number;
  isLinkedToLoaded: boolean;
  isLoaded: boolean;
  showOnHover: boolean;
}

const TitleListTimeUntilChip = memo(TitleListTimeUntilChipImpl);
function TitleListTimeUntilChipImpl({
  timeStart,
  delay,
  dayOffset,
  totalGap,
  isLinkedToLoaded,
  isLoaded,
  showOnHover,
}: TitleListTimeUntilChipProps) {
  const timeUntil = useTimeUntilExpectedStart({ timeStart, delay, dayOffset }, { totalGap, isLinkedToLoaded });
  const isDue = !isLoaded && timeUntil < MILLIS_PER_SECOND;

  let timeUntilString = 'LIVE';
  if (!isLoaded) {
    timeUntilString = isDue ? 'DUE' : formatDuration(Math.abs(timeUntil), timeUntil > 2 * MILLIS_PER_MINUTE);
  }

  const chipStatus = isLoaded ? 'live' : isDue ? 'due' : 'pending';

  return (
    <Tooltip text='Expected time until start' className={style.chipSlot} data-hover-only={showOnHover || undefined}>
      <span data-chip-status={chipStatus} className={style.chipText}>
        {timeUntilString}
      </span>
    </Tooltip>
  );
}
