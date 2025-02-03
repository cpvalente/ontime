import { formatTime } from '../../../common/utils/time';
import SuperscriptTime from '../../../features/viewers/common/superscript-time/SuperscriptTime';

import './Schedule.scss';

const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

interface ScheduleItemProps {
  selected: 'past' | 'now' | 'future';
  timeStart: number;
  timeEnd: number;
  title: string;
  backstageEvent: boolean;
  colour: string;
  skip: boolean;
}

export default function ScheduleItem(props: ScheduleItemProps) {
  const { selected, timeStart, timeEnd, title, backstageEvent, colour, skip } = props;

  const start = formatTime(timeStart, formatOptions);
  const end = formatTime(timeEnd, formatOptions);
  const userColour = colour !== '' ? colour : '';
  const selectStyle = `entry--${selected}`;

  return (
    <li className={`entry ${selectStyle} ${skip ? 'skip' : ''}`}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: userColour }} />
        <div style={{ display: 'flex' }}>
          <SuperscriptTime time={start} />
          {' → '}
          <SuperscriptTime time={end} />
          {backstageEvent ? '*' : ''}
        </div>
      </div>
      <div className='entry-title'>{title}</div>
    </li>
  );
}
