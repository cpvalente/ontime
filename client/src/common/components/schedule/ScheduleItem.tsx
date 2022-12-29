import { formatTime } from '../../utils/time';

import './Schedule.scss';

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
  const {
    selected,
    timeStart,
    timeEnd,
    title,
    presenter,
    backstageEvent,
    colour,
    skip,
  } = props;

  const start = formatTime(timeStart, { format: 'hh:mm' });
  const end = formatTime(timeEnd, { format: 'hh:mm' });
  const userColour = colour !== '' ? colour : '';
  const selectStyle = `entry--${selected}`;

  return (
    <li className={`entry ${selectStyle} ${skip ? 'skip' : ''}`}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: userColour }} />
        {`${start} → ${end} ${backstageEvent ? '*' : ''}`}
      </div>
      <div className='entry-title'>{title}</div>
      {presenter && (
        <div className='entry-presenter'>{presenter}</div>
      )}
    </li>
  );
}
