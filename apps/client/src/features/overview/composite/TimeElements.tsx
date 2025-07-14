import { useMemo } from 'react';
import { TbCalendar, TbCalendarClock, TbCalendarDown, TbCalendarStar, TbFlagDown, TbFlagStar } from 'react-icons/tb';
import { isOntimeBlock, OntimeBlock, OntimeEvent, TimerType } from 'ontime-types';
import { isPlaybackActive, millisToString } from 'ontime-utils';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import {
  useClock,
  useCurrentBlockId,
  useNextFlag,
  useRuntimeOverview,
  useRuntimePlaybackOverview,
  useTimer,
} from '../../../common/hooks/useSocket';
import { useEntry } from '../../../common/hooks-query/useRundown';
import { getOffsetState, getOffsetText } from '../../../common/utils/offset';
import { cx, enDash, timerPlaceholder } from '../../../common/utils/styleUtils';
import { formatTime, useTimeUntilStart } from '../../../common/utils/time';
import { calculateEndAndDaySpan, formattedTime } from '../overview.utils';

import { TimeColumn } from './TimeLayout';

import style from './TimeElements.module.scss';

export function StartTimes() {
  const { plannedEnd, plannedStart, actualStart, expectedEnd } = useRuntimeOverview();
  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);

  const muted = maybeExpectedEnd === null;

  return (
    <div className={style.column}>
      <div className={style.row}>
        <span className={style.label}>Start</span>
        <div className={style.labelledElement}>
          <Tooltip text='Planned start time' render={<TbCalendar className={style.icon} />} />
          <span className={cx([style.time])}>{formatTime(plannedStart)}</span>
        </div>
        <div className={style.labelledElement}>
          <Tooltip text='Actual start time' render={<TbCalendarClock className={style.icon} />} />
          <span className={cx([style.time, muted && style.muted])}>{formattedTime(actualStart)}</span>
        </div>
      </div>
      <div className={style.row}>
        <span className={style.label}>End</span>
        <div className={style.labelledElement}>
          <Tooltip text='Planned end time' render={<TbCalendar className={style.icon} />} />
          {maybePlannedDaySpan >= 0 ? (
            <Tooltip
              text={`Event spans over ${maybePlannedDaySpan + 1} days`}
              render={<span className={cx([style.time, style.daySpan])} />}
            >
              {formatTime(maybePlannedEnd)}
            </Tooltip>
          ) : (
            <span className={cx([style.time, muted && style.muted])}>{formatTime(maybePlannedEnd)}</span>
          )}
        </div>
        <div className={style.labelledElement}>
          <Tooltip text='Expected end time' render={<TbCalendarStar className={style.icon} />} />
          {maybeExpectedEnd !== null && maybeExpectedDaySpan >= 0 ? (
            <Tooltip
              text={`Event spans over ${maybeExpectedDaySpan + 1} days`}
              render={<span className={cx([style.time, style.daySpan])} />}
            >
              {formattedTime(maybeExpectedEnd)}
            </Tooltip>
          ) : (
            <span className={cx([style.time, muted && style.muted])}>{formattedTime(maybeExpectedEnd)}</span>
          )}
        </div>
      </div>
    </div>
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
  const { blockStartedAt, clock, blockExpectedEnd } = useRuntimePlaybackOverview();
  const { currentBlockId } = useCurrentBlockId();
  const entry = useEntry(currentBlockId);

  if (!currentBlockId) {
    return (
      <div className={style.metadataRow}>
        <span className={style.label}>Group</span>
        <div className={style.labelledElement}>
          <Tooltip text='Time to scheduled group end' render={<TbCalendarDown className={style.icon} />} />
          <span className={cx([style.time, style.muted])}>{timerPlaceholder}</span>
        </div>
        <div className={style.labelledElement}>
          <Tooltip text='Time to expected group end' render={<TbCalendarStar className={style.icon} />} />
          <span className={cx([style.time, style.muted])}>{timerPlaceholder}</span>
        </div>
      </div>
    );
  }

  const remainingBlockDuration = (() => {
    if (blockStartedAt === null || !entry) return timerPlaceholder;
    if (!isOntimeBlock(entry)) return timerPlaceholder;
    return formattedTime(blockStartedAt + entry.duration - clock, 3, TimerType.CountDown);
  })();

  const timeUntilBlockEnd = (() => {
    if (blockExpectedEnd === null) return timerPlaceholder;
    return formattedTime(blockExpectedEnd - clock, 3, TimerType.CountDown);
  })();

  const groupTitle = (entry as OntimeBlock | null)?.title || 'Group';

  return (
    <div className={style.metadataRow}>
      <span className={style.labelTitle}>{groupTitle}</span>
      <div className={style.labelledElement}>
        <Tooltip text='Time to scheduled group end' render={<TbCalendarDown className={style.icon} />} />
        <span className={cx([style.time, blockStartedAt === null && style.muted])}>{remainingBlockDuration}</span>
      </div>
      <div className={style.labelledElement}>
        <Tooltip text='Time to expected group end' render={<TbCalendarStar className={style.icon} />} />
        <span className={cx([style.time, blockExpectedEnd === null && style.muted])}>{timeUntilBlockEnd}</span>
      </div>
    </div>
  );
}

function FlagTimes() {
  const { clock } = useClock();
  const { nextFlag } = useNextFlag();
  const entry = useEntry(nextFlag?.id ?? null);

  // TODO(v4): can we make a good approximation of time until next flag?
  const timeUntil = useTimeUntilStart({
    timeStart: nextFlag?.start ?? 0,
    delay: 0,
    dayOffset: 0,
    totalGap: 0,
    isLinkedToLoaded: true,
  });

  if (!nextFlag) {
    return (
      <div className={style.metadataRow}>
        <span className={style.label}>Flag</span>
        <div className={style.labelledElement}>
          <Tooltip text='Time to next flag scheduled start' render={<TbFlagDown className={style.icon} />} />
          <span className={cx([style.time, style.muted])}>{timerPlaceholder}</span>
        </div>
        <div className={style.labelledElement}>
          <Tooltip text='Time to next flag expected start' render={<TbFlagStar className={style.icon} />} />
          <span className={cx([style.time, style.muted])}>{timerPlaceholder}</span>
        </div>
      </div>
    );
  }

  const muted = nextFlag === null;
  const flagTitle = (entry as OntimeEvent | null)?.title || 'Flag';
  const timeToNextFlag = nextFlag.start - clock;
  const display = millisToString(timeToNextFlag, { fallback: timerPlaceholder });
  const timeUntilDisplay = millisToString(timeUntil, { fallback: timerPlaceholder });

  return (
    <div className={style.metadataRow}>
      <span className={cx([style.labelTitle])}>{flagTitle}</span>
      <div className={style.labelledElement}>
        <Tooltip text='Time to next flag scheduled start' render={<TbFlagDown className={style.icon} />} />
        <span className={cx([style.time])}>{display}</span>
      </div>
      <div className={style.labelledElement}>
        <Tooltip text='Time to next flag expected start' render={<TbFlagStar className={style.icon} />} />
        <span className={cx([style.time, muted && style.muted])}>{timeUntilDisplay}</span>
      </div>
    </div>
  );
}

export function ProgressOverview() {
  const { numEvents, selectedEventIndex } = useRuntimePlaybackOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const progressText = numEvents ? `${current} of ${numEvents || enDash}` : enDash;

  return <TimeColumn label='Progress' value={progressText} />;
}

export function OffsetOverview() {
  const { offset, playback } = useRuntimePlaybackOverview();

  const isPlaying = isPlaybackActive(playback);
  const correctedOffset = offset * -1;
  const offsetState = getOffsetState(correctedOffset);
  const offsetClasses = cx([style.offset, offsetState && style[offsetState]]);
  const offsetText = getOffsetText(isPlaying ? correctedOffset : null);

  return <TimeColumn label='Over / under' value={offsetText} className={offsetClasses} testId='offset' />;
}

export function ClockOverview() {
  const { clock } = useClock();

  return <TimeColumn label='Time now' value={formattedTime(clock)} />;
}

export function TimerOverview() {
  const { current } = useTimer();

  const display = millisToString(current, { fallback: timerPlaceholder });

  return <TimeColumn label='Running timer' value={display} muted={current === null} />;
}
