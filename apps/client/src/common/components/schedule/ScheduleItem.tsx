import SuperscriptTime from '../../../features/viewers/common/superscript-time/SuperscriptTime';
import { formatTime } from '../../utils/time';

import './Schedule.scss';

const formatOptions = {
  format: 'hh:mm a',
};

interface ScheduleItemProps {
  selected: 'past' | 'now' | 'future';
  timeStart: number;
  timeEnd: number;
  title: string;
  presenter?: string;
  backstageEvent: boolean;
  colour: string;
  skip: boolean;
}

export default function ScheduleItem(props: ScheduleItemProps) {
  const { selected, timeStart, timeEnd, title, presenter, backstageEvent, colour, skip } = props;

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
      {presenter && <div className='entry-presenter'>{presenter}</div>}
    </li>
  );
}
