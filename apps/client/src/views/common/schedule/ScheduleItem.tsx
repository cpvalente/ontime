import { OntimeEvent } from 'ontime-types';
import { getExpectedStart } from 'ontime-utils';

import { useExpectedStartData } from '../../../common/hooks/useSocket';
import { getOffsetState } from '../../../common/utils/offset';
import { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import { cx } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
import SuperscriptTime from '../../../features/viewers/common/superscript-time/SuperscriptTime';

import { useScheduleOptions } from './schedule.options';

import './Schedule.scss';

const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

interface ScheduleItemProps {
  event: ExtendedEntry<OntimeEvent>;
}

export default function ScheduleItem({ event }: ScheduleItemProps) {
  const { showExpected } = useScheduleOptions();

  if (showExpected) {
    return <ExpectedScheduleItem event={event} />;
  }

  const { delay, timeStart, timeEnd, title, colour, skip } = event;

  if (delay > 0) {
    return <DelayedScheduleItem event={event} />;
  }

  const start = formatTime(timeStart, formatOptions);
  const end = formatTime(timeEnd, formatOptions);
  return (
    <li className={cx(['entry', skip && 'entry--skip'])}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: colour }} />
        <SuperscriptTime time={start} />
        →
        <SuperscriptTime time={end} />
      </div>
      <div className='entry-title'>{title}</div>
    </li>
  );
}

function DelayedScheduleItem({ event }: ScheduleItemProps) {
  const { timeStart, timeEnd, title, colour, skip, delay } = event;
  const start = formatTime(timeStart, formatOptions);
  const end = formatTime(timeEnd, formatOptions);
  const delayedStart = formatTime(timeStart + delay, formatOptions);
  const delayedEnd = formatTime(timeEnd + delay, formatOptions);

  return (
    <li className={cx(['entry', skip && 'entry--skip'])}>
      <div className='entry-times'>
        <span className='entry-times--delayed'>
          <span className='entry-colour' style={{ backgroundColor: colour }} />
          <SuperscriptTime time={start} />
          →
          <SuperscriptTime time={end} />
        </span>
        <span className='entry-times--delay'>
          <SuperscriptTime time={delayedStart} />
          →
          <SuperscriptTime time={delayedEnd} />
        </span>
      </div>
      <div className='entry-title'>{title}</div>
    </li>
  );
}

function ExpectedScheduleItem({ event }: ScheduleItemProps) {
  const { timeStart, duration, delay, countToEnd, isLinkedToLoaded, totalGap, skip, colour, title } = event;
  const { offset, currentDay, actualStart, plannedStart: plannedRundownStart, mode } = useExpectedStartData();

  const expectedStart = getExpectedStart(event, {
    currentDay,
    totalGap,
    actualStart,
    plannedStart: plannedRundownStart,
    isLinkedToLoaded,
    offset,
    mode,
  });

  const plannedEnd = timeStart + duration + delay;
  const expectedEnd = countToEnd ? Math.max(expectedStart + duration, plannedEnd) : expectedStart + duration;

  return (
    <li className={cx(['entry', skip && 'entry--skip'])}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: colour }} />
        <ExpectedTime expectedTime={expectedStart} plannedTime={timeStart} />
        →
        <ExpectedTime expectedTime={expectedEnd} plannedTime={plannedEnd} />
      </div>
      <div className='entry-title'>{title}</div>
    </li>
  );
}

interface ExpectedTimeProps {
  expectedTime: number;
  plannedTime: number;
}

function ExpectedTime({ expectedTime, plannedTime }: ExpectedTimeProps) {
  const timeDisplay = formatTime(expectedTime);
  const expectedState = getOffsetState(plannedTime - expectedTime);
  return <SuperscriptTime className={`entry-times--${expectedState}`} time={timeDisplay} />;
}
