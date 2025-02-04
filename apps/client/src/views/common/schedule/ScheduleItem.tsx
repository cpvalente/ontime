import { cx } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
import SuperscriptTime from '../../../features/viewers/common/superscript-time/SuperscriptTime';

import './Schedule.scss';

const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

interface ScheduleItemProps {
  timeStart: number;
  timeEnd: number;
  title: string;
  backstageEvent: boolean;
  colour?: string;
  skip?: boolean;
  delay: number;
}

export default function ScheduleItem(props: ScheduleItemProps) {
  const { timeStart, timeEnd, title, backstageEvent, colour, skip, delay } = props;

  const start = formatTime(timeStart, formatOptions);
  const end = formatTime(timeEnd, formatOptions);

  if (delay > 0) {
    const delayedStart = formatTime(timeStart + delay, formatOptions);
    const delayedEnd = formatTime(timeEnd + delay, formatOptions);

    return (
      <li className={cx(['entry', skip && 'entry--skip'])}>
        <div className='entry-times'>
          <span className='entry-times--delayed'>
            <span className='entry-colour' style={{ backgroundColor: colour }} />
            <SuperscriptTime time={start} />
            {' → '}
            <SuperscriptTime time={end} />
            {backstageEvent && '*'}
          </span>
          <span className='entry-times--delay'>
            <SuperscriptTime time={delayedStart} />
            {' → '}
            <SuperscriptTime time={delayedEnd} />
            {backstageEvent && '*'}
          </span>
        </div>
        <div className='entry-title'>{title}</div>
      </li>
    );
  }

  return (
    <li className={cx(['entry', skip && 'entry--skip'])}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: colour }} />
        <SuperscriptTime time={start} />
        {' → '}
        <SuperscriptTime time={end} />
        {backstageEvent && '*'}
      </div>
      <div className='entry-title'>{title}</div>
    </li>
  );
}
