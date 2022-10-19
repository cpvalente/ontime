import { formatTime } from '../../utils/time';

import './Paginator.scss';

interface TodayItemProps {
  selected: number;
  timeStart: number;
  timeEnd: number;
  title: string;
  backstageEvent: boolean;
  colour: string;
  skip: boolean;
}

export default function TodayItem(props: TodayItemProps) {
  const { selected, timeStart, timeEnd, title, backstageEvent, colour, skip } = props;

  // Format timers
  const start = formatTime(timeStart, { format: 'hh:mm' });
  const end = formatTime(timeEnd, { format: 'hh:mm' });

  // user colours
  const userColour = colour !== '' ? colour : 'transparent';

  let selectStyle = 'entry--past';
  if (selected === 1) selectStyle = 'entry--now';
  else if (selected === 2) selectStyle = 'entry--future';
  return (
    <div className={`entry ${selectStyle} ${skip ? 'skip': ''}}`} style={{ borderLeft: `4px solid ${userColour}` }}>
      <div className='entry-times'>
        {`${start} · ${end}`}
      </div>
      <div className='entry-title'>{title}</div>
      {backstageEvent && <div className='backstage-indicator' />}
    </div>
  );
}
