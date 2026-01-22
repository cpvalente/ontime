import { dayInMs, MILLIS_PER_MINUTE } from 'ontime-utils';

import ClockTime from '../../../views/common/clock-time/ClockTime';
import { getOffsetState } from '../../utils/offset';
import { ExpectedEvent } from '../../utils/rundownMetadata';
import { cx } from '../../utils/styleUtils';

import './ScheduleTime.scss';

type ScheduleTimeProps = {
  event: ExpectedEvent;
  showExpected: boolean;
  className?: string;
  preferredFormat12?: string;
  preferredFormat24?: string;
};

//TODO: consider relative mode
export default function ScheduleTime(props: ScheduleTimeProps) {
  const { event, showExpected, className, preferredFormat12 = 'h:mm a', preferredFormat24 = 'HH:mm' } = props;
  const { timeStart, duration, delay, expectedStart, countToEnd } = event;

  const plannedStart = timeStart + delay + event.dayOffset * dayInMs;

  // only show new exacted value if outside  range of the planned value
  const isExpectedValueShow = showExpected && isOutsideRange(plannedStart, expectedStart);

  const plannedStateClass = isExpectedValueShow ? 'schedule__--strike' : delay !== 0 ? 'schedule__--delayed' : '';

  const expectedOffsetState = getOffsetState(expectedStart - plannedStart);
  const expectedStateClass = expectedOffsetState ? `schedule__--${expectedOffsetState}` : '';
  const plannedEnd = plannedStart + duration + delay;
  const expectedEnd = countToEnd ? Math.max(expectedStart + duration, plannedEnd) : expectedStart + duration;
  const expectedEndOffsetState = getOffsetState(expectedEnd - plannedEnd);
  const expectedEndClass = expectedEndOffsetState ? `schedule__--${expectedEndOffsetState}` : '';

  return (
    <div className={cx(['schedule__', className])}>
      <ClockTime
        value={plannedStart}
        preferredFormat12={preferredFormat12}
        preferredFormat24={preferredFormat24}
        className={plannedStateClass}
      />
      {!isExpectedValueShow && (
        <>
          →
          <ClockTime
            value={plannedEnd}
            preferredFormat12={preferredFormat12}
            preferredFormat24={preferredFormat24}
            className={plannedStateClass}
          />
        </>
      )}
      {isExpectedValueShow && (
        <>
          <ClockTime
            value={expectedStart}
            className={expectedStateClass}
            preferredFormat12={preferredFormat12}
            preferredFormat24={preferredFormat24}
          />
          →
          <ClockTime
            value={expectedEnd}
            className={expectedEndClass}
            preferredFormat12={preferredFormat12}
            preferredFormat24={preferredFormat24}
          />
        </>
      )}
    </div>
  );
}

function isOutsideRange(a: number, b: number): boolean {
  return Math.abs(a - b) > MILLIS_PER_MINUTE;
}
