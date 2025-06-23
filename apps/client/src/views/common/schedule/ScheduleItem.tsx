import { useRuntimeOffset } from '../../../common/hooks/useSocket';
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
  const { showProjected } = useScheduleOptions();

  if (showProjected) {
    return (
      <ProjectedScheduleItem
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

function ProjectedScheduleItem(props: ScheduleItemProps) {
  const { timeStart, timeEnd, title, colour, skip, delay } = props;

  return (
    <li className={cx(['entry', skip && 'entry--skip'])}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: colour }} />
        <ProjectedTime time={timeStart} delay={delay} />
        →
        <ProjectedTime time={timeEnd} delay={delay} />
      </div>
      <div className='entry-title'>{title}</div>
    </li>
  );
}

interface OffsetTimeProps {
  time: number;
  delay: number;
}

function ProjectedTime(props: OffsetTimeProps) {
  const { time, delay } = props;
  const { offset } = useRuntimeOffset();

  const projectedOffset = offset - delay;
  const projectedTime = formatTime(time - offset, formatOptions);

  return (
    <SuperscriptTime
      className={cx([projectedOffset > 0 && 'entry-times--ahead', projectedOffset < 0 && 'entry-times--behind'])}
      time={projectedTime}
    />
  );
}
