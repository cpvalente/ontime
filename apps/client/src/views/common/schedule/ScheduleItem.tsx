import { useRuntimeOffset } from '../../../common/hooks/useSocket';
import { getOffsetState } from '../../../common/utils/offset';
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
  timeStart: number;
  timeEnd: number;
  title: string;
  colour?: string;
  skip?: boolean;
  delay: number;
}

export default function ScheduleItem(props: ScheduleItemProps) {
  const { timeStart, timeEnd, title, colour, skip, delay } = props;
  const { showExpected } = useScheduleOptions();

  if (showExpected) {
    return (
      <ExpectedScheduleItem
        timeStart={timeStart}
        timeEnd={timeEnd}
        title={title}
        colour={colour}
        skip={skip}
        delay={delay}
      />
    );
  }

  if (delay > 0) {
    return (
      <DelayedScheduleItem
        timeStart={timeStart}
        timeEnd={timeEnd}
        title={title}
        colour={colour}
        skip={skip}
        delay={delay}
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

function DelayedScheduleItem(props: ScheduleItemProps) {
  const { timeStart, timeEnd, title, colour, skip, delay } = props;

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

function ExpectedScheduleItem(props: ScheduleItemProps) {
  const { timeStart, timeEnd, title, colour, skip, delay } = props;

  return (
    <li className={cx(['entry', skip && 'entry--skip'])}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: colour }} />
        <ExpectedTime time={timeStart} delay={delay} />
        →
        <ExpectedTime time={timeEnd} delay={delay} />
      </div>
      <div className='entry-title'>{title}</div>
    </li>
  );
}

interface ExpectedTimeProps {
  time: number;
  delay: number;
}

function ExpectedTime(props: ExpectedTimeProps) {
  const { time, delay } = props;
  const { offset } = useRuntimeOffset();

  const expectedOffset = offset - delay;
  const expectedTime = formatTime(time - offset, formatOptions);
  const expectedState = getOffsetState(expectedOffset);

  return <SuperscriptTime className={`entry-times--${expectedState}`} time={expectedTime} />;
}
