import { OntimeEvent } from 'ontime-types';

import { useExpectedStartData } from '../../../common/hooks/useSocket';
import { getOffsetState } from '../../../common/utils/offset';
import { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import { cx } from '../../../common/utils/styleUtils';
import { formatTime, getExpectedTimesFromExtendedEvent } from '../../../common/utils/time';
import SuperscriptPeriod from '../superscript-time/SuperscriptPeriod';
import DayShift from '../timezone/DayShift';
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
> & {
  timezoneDelta: number;
};

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
  timezoneDelta,
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
            timezoneDelta={timezoneDelta}
          />
        ) : delay > 0 ? (
          <DelayedScheduleItem
            timeStart={timeStart}
            delay={delay}
            colour={colour}
            timeEnd={timeEnd}
            timezoneDelta={timezoneDelta}
          />
        ) : (
          <PlannedScheduleItem timeStart={timeStart} timeEnd={timeEnd} colour={colour} timezoneDelta={timezoneDelta} />
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
  timezoneDelta,
}: Pick<ScheduleItemProps, 'timeStart' | 'timeEnd' | 'colour' | 'timezoneDelta'>) {
  const start = formatTime(timeStart, { ...formatOptions, timezoneDelta });
  const end = formatTime(timeEnd, { ...formatOptions, timezoneDelta });

  return (
    <>
      <span className='entry-colour' style={{ backgroundColor: colour }} />
      <SuperscriptPeriod time={start} suffix={<DayShift time={timeStart} timezoneDelta={timezoneDelta} />} />
      →
      <SuperscriptPeriod time={end} suffix={<DayShift time={timeEnd} timezoneDelta={timezoneDelta} />} />
    </>
  );
}

function DelayedScheduleItem({
  timeStart,
  timeEnd,
  colour,
  delay,
  timezoneDelta,
}: Pick<ScheduleItemProps, 'timeStart' | 'timeEnd' | 'colour' | 'delay' | 'timezoneDelta'>) {
  const shiftedOptions = { ...formatOptions, timezoneDelta };
  const start = formatTime(timeStart, shiftedOptions);
  const end = formatTime(timeEnd, shiftedOptions);
  const delayedStart = formatTime(timeStart + delay, shiftedOptions);
  const delayedEnd = formatTime(timeEnd + delay, shiftedOptions);

  return (
    <>
      <span className='entry-times--delayed'>
        <span className='entry-colour' style={{ backgroundColor: colour }} />
        <SuperscriptPeriod time={start} suffix={<DayShift time={timeStart} timezoneDelta={timezoneDelta} />} />
        →
        <SuperscriptPeriod time={end} suffix={<DayShift time={timeEnd} timezoneDelta={timezoneDelta} />} />
      </span>
      <span className='entry-times--delay'>
        <SuperscriptPeriod
          time={delayedStart}
          suffix={<DayShift time={timeStart + delay} timezoneDelta={timezoneDelta} />}
        />
        →
        <SuperscriptPeriod
          time={delayedEnd}
          suffix={<DayShift time={timeEnd + delay} timezoneDelta={timezoneDelta} />}
        />
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
  timezoneDelta,
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
      <ExpectedTime expectedTime={expectedStart} plannedTime={timeStart} timezoneDelta={timezoneDelta} />
      →
      <ExpectedTime expectedTime={expectedEnd} plannedTime={plannedEnd} timezoneDelta={timezoneDelta} />
    </>
  );
}

interface ExpectedTimeProps {
  expectedTime: number;
  plannedTime: number;
  timezoneDelta: number;
}

function ExpectedTime({ expectedTime, plannedTime, timezoneDelta }: ExpectedTimeProps) {
  const timeDisplay = formatTime(expectedTime, { timezoneDelta });
  const expectedState = getOffsetState(expectedTime - plannedTime);
  return (
    <SuperscriptPeriod
      className={`entry-times--${expectedState}`}
      time={timeDisplay}
      suffix={<DayShift time={expectedTime} timezoneDelta={timezoneDelta} />}
    />
  );
}
