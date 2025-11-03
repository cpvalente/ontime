import { OntimeEvent } from 'ontime-types';

import { useExpectedStartData } from '../../../common/hooks/useSocket';
import { getOffsetState } from '../../../common/utils/offset';
import { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import { cx } from '../../../common/utils/styleUtils';
import { formatTime, getExpectedTimesFromExtendedEvent } from '../../../common/utils/time';
import SuperscriptPeriod from '../../../features/viewers/common/superscript-time/SuperscriptPeriod';

import { useScheduleOptions } from './schedule.options';

import './Schedule.scss';

const formatOptions = {
  format12: 'h:mm a',
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
  | 'cue'
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
  cue,
}: ScheduleItemProps) {
  const { showExpected } = useScheduleOptions();

  return (
    <li className={cx(['entry', skip && 'entry--skip'])} data-testid={cue}>
      <div className='entry-times'>
        {showExpected ? (
          <ExpectedScheduleItem
            timeStart={timeStart}
            dayOffset={dayOffset}
            delay={delay}
            totalGap={totalGap}
            isLinkedToLoaded={isLinkedToLoaded}
            countToEnd={countToEnd}
            duration={duration}
            colour={colour}
          />
        ) : delay > 0 ? (
          <DelayedScheduleItem timeStart={timeStart} delay={delay} colour={colour} timeEnd={timeEnd} />
        ) : (
          <PlannedScheduleItem timeStart={timeStart} timeEnd={timeEnd} colour={colour} />
        )}
      </div>
      <div className='entry-title'>{title}</div>
    </li>
  );
}

function PlannedScheduleItem({
  timeStart,
  timeEnd,
  colour,
}: Pick<ScheduleItemProps, 'timeStart' | 'timeEnd' | 'colour'>) {
  const start = formatTime(timeStart, formatOptions);
  const end = formatTime(timeEnd, formatOptions);

  return (
    <>
      <span className='entry-colour' style={{ backgroundColor: colour }} />
      <SuperscriptPeriod time={start} />
      →
      <SuperscriptPeriod time={end} />
    </>
  );
}

function DelayedScheduleItem({
  timeStart,
  timeEnd,
  colour,
  delay,
}: Pick<ScheduleItemProps, 'timeStart' | 'timeEnd' | 'colour' | 'delay'>) {
  const start = formatTime(timeStart, formatOptions);
  const end = formatTime(timeEnd, formatOptions);
  const delayedStart = formatTime(timeStart + delay, formatOptions);
  const delayedEnd = formatTime(timeEnd + delay, formatOptions);

  return (
    <>
      <span className='entry-times--delayed'>
        <span className='entry-colour' style={{ backgroundColor: colour }} />
        <SuperscriptPeriod time={start} />
        →
        <SuperscriptPeriod time={end} />
      </span>
      <span className='entry-times--delay'>
        <SuperscriptPeriod time={delayedStart} />
        →
        <SuperscriptPeriod time={delayedEnd} />
      </span>
    </>
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
}: Omit<ScheduleItemProps, 'timeEnd' | 'cue' | 'skip' | 'title'>) {
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
    <>
      <span className='entry-colour' style={{ backgroundColor: colour }} />
      <ExpectedTime expectedTime={expectedStart} plannedTime={timeStart} />
      →
      <ExpectedTime expectedTime={expectedEnd} plannedTime={plannedEnd} />
    </>
  );
}

interface ExpectedTimeProps {
  expectedTime: number;
  plannedTime: number;
}

function ExpectedTime({ expectedTime, plannedTime }: ExpectedTimeProps) {
  const timeDisplay = formatTime(expectedTime);
  const expectedState = getOffsetState(expectedTime - plannedTime);
  return <SuperscriptPeriod className={`entry-times--${expectedState}`} time={timeDisplay} />;
}
