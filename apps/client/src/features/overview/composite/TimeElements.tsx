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
import { OntimeEvent, OntimeGroup, TimerPhase, TimerType } from 'ontime-types';
import { isPlaybackActive, millisToString } from 'ontime-utils';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import {
  useClock,
  useCurrentGroupId,
  useNextFlag,
  useRundownOverview,
  useRuntimePlaybackOverview,
  useTimer,
} from '../../../common/hooks/useSocket';
import { useEntry } from '../../../common/hooks-query/useRundown';
import { getOffsetState, getOffsetText } from '../../../common/utils/offset';
import { cx, enDash, timerPlaceholder } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
import { calculateEndAndDaySpan, formattedTime } from '../overview.utils';

import { OverUnder, TimeColumn } from './TimeLayout';

import style from './TimeElements.module.scss';

export function StartTimes() {
  const { plannedEnd, plannedStart, actualStart, expectedEnd } = useRundownOverview();

  const plannedStartText = plannedStart === null ? timerPlaceholder : formatTime(plannedStart);

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const plannedEndText = maybePlannedEnd === null ? timerPlaceholder : formatTime(maybePlannedEnd);

  return (
    <div className={style.column}>
      <div className={style.row}>
        <span className={style.label}>Start</span>
        <div className={style.labelledElement}>
          <Tooltip text='Planned start time' render={<TbCalendarPin className={style.icon} />} />
          <span className={cx([style.time, plannedStart === null && style.muted])}>{plannedStartText}</span>
        </div>
        <div className={style.labelledElement}>
          <Tooltip text='Actual start time' render={<TbCalendarClock className={style.icon} />} />
          <span className={cx([style.time, actualStart === null && style.muted])}>{formattedTime(actualStart)}</span>
        </div>
      </div>
      <div className={style.row}>
        <span className={style.label}>End</span>
        <div className={style.labelledElement}>
          <Tooltip text='Planned end time' render={<TbCalendarPin className={style.icon} />} />
          {maybePlannedDaySpan > 0 ? (
            <Tooltip
              text={`Event spans over ${maybePlannedDaySpan + 1} days`}
              render={<span className={cx([style.time, style.daySpan])} />}
            >
              {plannedEndText}
            </Tooltip>
          ) : (
            <span className={cx([style.time, plannedEnd === null && style.muted])}>{plannedEndText}</span>
          )}
        </div>
        <div className={style.labelledElement}>
          <Tooltip text='Expected end time' render={<TbCalendarStar className={style.icon} />} />
          {maybeExpectedEnd !== null && maybeExpectedDaySpan > 0 ? (
            <Tooltip
              text={`Event spans over ${maybeExpectedDaySpan + 1} days`}
              render={<span className={cx([style.time, style.daySpan])} />}
            >
              {formattedTime(maybeExpectedEnd)}
            </Tooltip>
          ) : (
            <span className={cx([style.time, maybeExpectedEnd === null && style.muted])}>
              {formattedTime(maybeExpectedEnd)}
            </span>
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

//TODO: there a some things here we still need to think about, mainly what to do whit the planed group duration in relation to the events
function GroupTimes() {
  const { clock, groupExpectedEnd } = useRuntimePlaybackOverview();
  const { currentGroupId } = useCurrentGroupId();
  const group = useEntry(currentGroupId) as OntimeGroup | null;

  // the group end time dose not encode any day offsets
  const plannedGroupEnd = group && group.timeStart !== null ? group.timeStart + group.duration - clock : null;
  const plannedTimeUntilGroupEnd = formattedTime(plannedGroupEnd, 3, TimerType.CountDown);

  const expectedGroupEnd = groupExpectedEnd !== null ? groupExpectedEnd - clock : null;
  const expectedTimeUntilGroupEnd = formattedTime(expectedGroupEnd, 3, TimerType.CountDown);

  const groupTitle = group?.title ?? null;

  return (
    <div className={style.metadataRow}>
      <span className={groupTitle ? style.labelTitle : style.label}>{`${groupTitle ? groupTitle : 'Group'} `}</span>
      <div className={style.labelledElement}>
        <Tooltip text='Time to planned group end' render={<TbFolderPin className={style.icon} />} />
        <span className={cx([style.time, !group && style.muted])}>{plannedTimeUntilGroupEnd}</span>
      </div>
      <div className={style.labelledElement}>
        <Tooltip text='Time to expected group end' render={<TbFolderStar className={style.icon} />} />
        <span className={cx([style.time, groupExpectedEnd === null && style.muted])}>{expectedTimeUntilGroupEnd}</span>
      </div>
    </div>
  );
}

function FlagTimes() {
  const { clock } = useClock();
  const { id, expectedStart } = useNextFlag();
  const entry = useEntry(id) as OntimeEvent | null;

  const plannedFlagStart = entry ? entry.timeStart - clock : null;
  const plannedTimeUntilDisplay = formattedTime(plannedFlagStart, 3, TimerType.CountDown);

  const expectedTimeUntil = expectedStart !== null ? expectedStart - clock : null;
  const expectedTimeUntilDisplay = formattedTime(expectedTimeUntil, 3, TimerType.CountDown);

  const title = entry?.title ?? null;

  return (
    <div className={style.metadataRow}>
      <span className={title ? style.labelTitle : style.label}>{`${title ? title : 'Flag'} `}</span>
      <div className={style.labelledElement}>
        <Tooltip text='Time to next flag planned start' render={<TbFlagPin className={style.icon} />} />
        <span data-testid='flag-plannedStart' className={cx([style.time, !entry && style.muted])}>{plannedTimeUntilDisplay}</span>
      </div>
      <div className={style.labelledElement}>
        <Tooltip text='Time to next flag expected start' render={<TbFlagStar className={style.icon} />} />
        <span data-testid='flag-expectedStart' className={cx([style.time, expectedTimeUntil === null && style.muted])}>{expectedTimeUntilDisplay}</span>
      </div>
    </div>
  );
}

export function ProgressOverview() {
  const { numEvents, selectedEventIndex } = useRuntimePlaybackOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const progressText = numEvents ? `${current} of ${numEvents || enDash}` : enDash;

  return <TimeColumn label='Progress' value={progressText} state={selectedEventIndex === null ? 'muted' : 'active'} />;
}

export function OffsetOverview() {
  const { offset, playback } = useRuntimePlaybackOverview();

  const isPlaying = isPlaybackActive(playback);
  const offsetState = getOffsetState(isPlaying ? offset : null);
  const offsetText = getOffsetText(isPlaying ? offset : null);

  return <OverUnder state={offsetState} value={offsetText} testId='offset' />;
}

export function ClockOverview({ className }: { className?: string }) {
  const { clock } = useClock();

  return <TimeColumn label='Time now' value={formattedTime(clock)} className={className} />;
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
