import { useMemo } from 'react';
import {
  TbCalendarClock,
  TbCalendarPin,
  TbCalendarStar,
  TbFlagPin,
  TbFlagStar,
  TbFolderPin,
  TbFolderStar,
} from 'react-icons/tb';
import { OffsetMode, OntimeEvent, OntimeGroup, TimerPhase, TimerType } from 'ontime-types';
import { dayInMs, isPlaybackActive, millisToString } from 'ontime-utils';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import {
  useClock,
  useCurrentGroupId,
  useFlagTimerOverView,
  useGroupTimerOverView,
  useNextFlag,
  useOffsetOverview,
  useProgressOverview,
  useRundownExpectedEnd,
  useStartTimesOverview,
  useTimer,
} from '../../../common/hooks/useSocket';
import { useEntry } from '../../../common/hooks-query/useRundown';
import { getOffsetState, getOffsetText } from '../../../common/utils/offset';
import { cx, enDash, timerPlaceholder } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
import SuperscriptPeriod from '../../../views/common/superscript-time/SuperscriptPeriod';
import { calculateEndAndDaySpan, formatDueTime } from '../overview.utils';

import { OverUnder, TimeColumn, WrappedInTimeColumn } from './TimeLayout';

import style from './TimeElements.module.scss';

interface OverviewTimeElementsProps {
  shouldFormat?: boolean;
}

export function StartTimes({ shouldFormat }: OverviewTimeElementsProps) {
  const { plannedEnd, plannedStart, actualStart } = useStartTimesOverview();

  const formatOptions = { format12: 'hh:mm:ss a', format24: 'HH:mm:ss' };

  const plannedStartText = (() => {
    if (plannedStart === null) return timerPlaceholder;
    if (shouldFormat) return formatTime(plannedStart, formatOptions);
    return millisToString(plannedStart, { fallback: timerPlaceholder });
  })();

  const actualStartText = (() => {
    if (actualStart === null) return timerPlaceholder;
    if (shouldFormat) return formatTime(actualStart, formatOptions);
    return millisToString(actualStart, { fallback: timerPlaceholder });
  })();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);

  const plannedEndText = (() => {
    if (maybePlannedEnd === null) return timerPlaceholder;
    if (shouldFormat) return formatTime(maybePlannedEnd, formatOptions);
    return millisToString(maybePlannedEnd, { fallback: timerPlaceholder });
  })();

  const multipleDays = maybePlannedDaySpan > 0;
  const plannedEndTooltip = multipleDays
    ? `Planned end time (rundown spans over ${maybePlannedDaySpan + 1} days)`
    : 'Planned end time';

  return (
    <div className={style.column}>
      <div className={style.row}>
        <span className={style.label}>Start</span>
        <Tooltip
          text='Planned start time'
          render={
            <div className={style.labelledElement}>
              <TbCalendarPin className={style.icon} />
              <SuperscriptPeriod
                className={cx([style.time, plannedStart === null && style.muted])}
                time={plannedStartText}
              />
            </div>
          }
        />
        <Tooltip
          text='Actual start time'
          render={
            <div className={style.labelledElement} data-testid='actual-start-time'>
              <TbCalendarClock className={style.icon} />
              <SuperscriptPeriod
                className={cx([style.time, actualStart === null && style.muted])}
                time={actualStartText}
              />
            </div>
          }
        />
      </div>

      <div className={style.row}>
        <span className={style.label}>End</span>
        <Tooltip
          text={plannedEndTooltip}
          render={
            <div className={style.labelledElement}>
              <TbCalendarPin className={style.icon} />
              <SuperscriptPeriod
                className={cx([style.time, plannedEnd === null && style.muted])}
                time={plannedEndText}
              />
              {multipleDays && (
                <span className={cx([style.time, style.daySpan])} data-day-offset={maybePlannedDaySpan} />
              )}
            </div>
          }
        />
        <RundownExpectedEnd shouldFormat={shouldFormat} />
      </div>
    </div>
  );
}

/**
 * Shows the expected end for the rundown
 * Extracted to improve performance as this is a ticking value
 */
function RundownExpectedEnd({ shouldFormat }: OverviewTimeElementsProps) {
  const expectedEnd = useRundownExpectedEnd();

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const maybeExpectedEndText = (() => {
    if (maybeExpectedEnd === null) return timerPlaceholder;
    if (shouldFormat) return formatTime(maybeExpectedEnd, { format12: 'hh:mm:ss a', format24: 'HH:mm:ss' });
    return millisToString(maybeExpectedEnd, { fallback: timerPlaceholder });
  })();

  const multipleDays = maybeExpectedEnd !== null && maybeExpectedDaySpan > 0;
  const tooltip = multipleDays
    ? `Expected end time (rundown spans over ${maybeExpectedDaySpan + 1} days)`
    : 'Expected end time';

  return (
    <Tooltip
      text={tooltip}
      render={
        <div className={style.labelledElement}>
          <TbCalendarStar className={style.icon} />
          <SuperscriptPeriod
            className={cx([style.time, maybeExpectedEnd === null && style.muted])}
            time={maybeExpectedEndText}
          />
          {multipleDays && <span className={cx([style.time, style.daySpan])} data-day-offset={maybeExpectedDaySpan} />}
        </div>
      }
    />
  );
}

export function MetadataTimes() {
  return (
    <div className={style.column}>
      <GroupTimes />
      <FlagTimes />
    </div>
  );
}

function GroupTimes() {
  const { clock, mode, groupExpectedEnd, actualGroupStart, currentDay, playback } = useGroupTimerOverView();
  const currentGroupId = useCurrentGroupId();
  const group = useEntry(currentGroupId) as OntimeGroup | null;

  const active = isPlaybackActive(playback);

  // the group end time dose not encode any day offsets so it is calculated with group start time and duration
  const plannedGroupEnd = (() => {
    if (!active) return null;
    if (!group || group.timeStart === null) return null;
    const normalizedClock = clock + currentDay * dayInMs;

    return mode === OffsetMode.Absolute
      ? group.timeStart + group.duration - normalizedClock
      : actualGroupStart + group.duration - normalizedClock;
  })();

  const plannedTimeUntilGroupEnd = formatDueTime(plannedGroupEnd, 3, TimerType.CountDown);

  const expectedGroupEnd = groupExpectedEnd !== null ? groupExpectedEnd - clock : null;
  const expectedTimeUntilGroupEnd = formatDueTime(expectedGroupEnd, 3, TimerType.CountDown);

  return (
    <div className={style.metadataRow}>
      <span className={group?.title ? style.labelTitle : style.label}>{`${group?.title || 'Group'} `}</span>
      <div className={style.labelledElement}>
        <Tooltip text='Time to planned group end' render={<TbFolderPin className={style.icon} />} />
        <span
          className={cx([
            style.time,
            (!group || !active) && style.muted,
            plannedTimeUntilGroupEnd === 'due' && style.dueTime,
          ])}
        >
          {plannedTimeUntilGroupEnd}
        </span>
      </div>
      <div className={style.labelledElement}>
        <Tooltip text='Time to expected group end' render={<TbFolderStar className={style.icon} />} />
        <span
          className={cx([
            style.time,
            !groupExpectedEnd && style.muted,
            expectedTimeUntilGroupEnd === 'due' && style.dueTime,
          ])}
        >
          {expectedTimeUntilGroupEnd}
        </span>
      </div>
    </div>
  );
}

function FlagTimes() {
  const { clock, mode, actualStart, plannedStart, playback, currentDay } = useFlagTimerOverView();
  const { id, expectedStart } = useNextFlag();
  const entry = useEntry(id) as OntimeEvent | null;

  const active = isPlaybackActive(playback);

  const plannedFlagStart = (() => {
    if (!active) return null;
    if (!entry) return null;
    const normalizedTimeStart = entry.timeStart + entry.dayOffset * dayInMs;
    const normalizedClock = clock + currentDay * dayInMs;
    return mode === OffsetMode.Absolute
      ? normalizedTimeStart - normalizedClock
      : normalizedTimeStart + actualStart - plannedStart - normalizedClock;
  })();

  const plannedTimeUntilDisplay = formatDueTime(plannedFlagStart, 3, TimerType.CountDown);

  const expectedTimeUntil = expectedStart !== null ? expectedStart - clock : null;
  const expectedTimeUntilDisplay = formatDueTime(expectedTimeUntil, 3, TimerType.CountDown);

  const title = entry?.title ?? null;

  return (
    <div className={style.metadataRow}>
      <span className={title ? style.labelTitle : style.label}>{`${title || 'Flag'} `}</span>
      <div className={style.labelledElement}>
        <Tooltip text='Time to next flag planned start' render={<TbFlagPin className={style.icon} />} />
        <span
          data-testid='flag-plannedStart'
          className={cx([
            style.time,
            (!entry || !active) && style.muted,
            plannedTimeUntilDisplay === 'due' && style.dueTime,
          ])}
        >
          {plannedTimeUntilDisplay}
        </span>
      </div>
      <div className={style.labelledElement}>
        <Tooltip text='Time to next flag expected start' render={<TbFlagStar className={style.icon} />} />
        <span
          data-testid='flag-expectedStart'
          className={cx([
            style.time,
            expectedTimeUntil === null && style.muted,
            expectedTimeUntilDisplay === 'due' && style.dueTime,
          ])}
        >
          {expectedTimeUntilDisplay}
        </span>
      </div>
    </div>
  );
}

export function ProgressOverview() {
  const { numEvents, selectedEventIndex } = useProgressOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const progressText = numEvents ? `${current} of ${numEvents || enDash}` : enDash;

  return <TimeColumn label='Progress' value={progressText} state={selectedEventIndex === null ? 'muted' : 'active'} />;
}

export function OffsetOverview() {
  const { offset, playback } = useOffsetOverview();

  const isPlaying = isPlaybackActive(playback);
  const offsetState = getOffsetState(isPlaying ? offset : null);
  const offsetText = getOffsetText(isPlaying ? offset : null);

  return <OverUnder state={offsetState} value={offsetText} testId='offset' />;
}

export function ClockOverview({ shouldFormat, className }: OverviewTimeElementsProps & { className?: string }) {
  const clock = useClock();
  const formattedClock = shouldFormat ? formatTime(clock) : millisToString(clock);

  return (
    <WrappedInTimeColumn
      label='Time now'
      className={className}
      render={(clockClasses) => <SuperscriptPeriod className={clockClasses} time={formattedClock} />}
    />
  );
}

export function TimerOverview({ className }: { className?: string }) {
  const timer = useTimer();

  const isWaiting = timer.phase === TimerPhase.Pending;
  const title = isWaiting ? 'Count to start' : 'Running timer';
  const display = millisToString(isWaiting ? timer.secondaryTimer : timer.current, { fallback: timerPlaceholder });
  const timerState = (() => {
    if (isWaiting) return 'waiting';
    if (timer.current === null) return 'muted';
    return 'active';
  })();

  return <TimeColumn label={title} value={display} state={timerState} className={className} />;
}
