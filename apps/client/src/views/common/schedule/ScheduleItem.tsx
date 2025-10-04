import { OntimeEvent } from 'ontime-types';

import { useExpectedStartData } from '../../../common/hooks/useSocket';
import { getOffsetState } from '../../../common/utils/offset';
import { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import { cx } from '../../../common/utils/styleUtils';
import { formatTime, getExpectedTimesFromExtendedEvent } from '../../../common/utils/time';
import SuperscriptTime from '../../../features/viewers/common/superscript-time/SuperscriptTime';

import { useScheduleOptions } from './schedule.options';

import './Schedule.scss';

const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

type ScheduleItemProps = Pick<
  ExtendedEntry<OntimeEvent>,
  | 'timeStart'
  | 'dayOffset'
  | 'delay'
  | 'totalGap'
  | 'isLinkedToLoaded'
  | 'countToEnd'
  | 'duration'
  | 'colour'
  | 'skip'
  | 'title'
  | 'timeEnd'
>;

export default function ScheduleItem({
  timeStart,
  dayOffset,
  delay,
  totalGap,
  isLinkedToLoaded,
  countToEnd,
  colour,
  duration,
  skip,
  title,
  timeEnd,
}: ScheduleItemProps) {
  const { showExpected } = useScheduleOptions();

  if (showExpected) {
    return (
      <ExpectedScheduleItem
        timeStart={timeStart}
        dayOffset={dayOffset}
        delay={delay}
        totalGap={totalGap}
        isLinkedToLoaded={isLinkedToLoaded}
        countToEnd={countToEnd}
        duration={duration}
        colour={colour}
        skip={skip}
        title={title}
      />
    );
  }

  if (delay > 0) {
    return (
      <DelayedScheduleItem
        timeStart={timeStart}
        delay={delay}
        colour={colour}
        skip={skip}
        timeEnd={timeEnd}
        title={title}
      />
    );
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

function DelayedScheduleItem({
  timeStart,
  timeEnd,
  title,
  colour,
  skip,
  delay,
}: Pick<ScheduleItemProps, 'timeStart' | 'timeEnd' | 'title' | 'colour' | 'skip' | 'delay'>) {
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

function ExpectedScheduleItem({
  timeStart,
  dayOffset,
  delay,
  totalGap,
  isLinkedToLoaded,
  countToEnd,
  colour,
  duration,
  skip,
  title,
}: Omit<ScheduleItemProps, 'timeEnd'>) {
  const expectedStartData = useExpectedStartData();
  const { expectedStart, expectedEnd, plannedEnd } = getExpectedTimesFromExtendedEvent(
    {
      timeStart,
      dayOffset,
      delay,
      totalGap,
      isLinkedToLoaded,
      countToEnd,
      duration,
    },
    expectedStartData,
  );

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
  const expectedState = getOffsetState(expectedTime - plannedTime);
  return <SuperscriptTime className={`entry-times--${expectedState}`} time={timeDisplay} />;
}
