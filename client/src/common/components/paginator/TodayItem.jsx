import PropTypes from 'prop-types';

import { formatTime } from '../../utils/time';

import './Paginator.scss';

export default function TodayItem(props) {
  const { selected, timeStart, timeEnd, title, backstageEvent, colour } = props;

  // Format timers
  const start = formatTime(timeStart, { format: 'hh:mm' });
  const end = formatTime(timeEnd, { format: 'hh:mm' });

  // user colours
  const userColour = colour !== '' ? colour : 'transparent';

  // select styling
  let selectStyle = 'entry--past';
  if (selected === 1) selectStyle = 'entry--now';
  else if (selected === 2) selectStyle = 'entry--future';
  return (
    <div className={`entry ${selectStyle}`} style={{ borderLeft: `4px solid ${userColour}` }}>
      <div className='entry-times'>
        {`${start} · ${end}`}
      </div>
      <div className='entry-title'>{title}</div>
      {backstageEvent && <div className='backstage-indicator' />}
    </div>
  );
}

TodayItem.propTypes = {
  selected: PropTypes.number,
  timeStart: PropTypes.number,
  timeEnd: PropTypes.number,
  title: PropTypes.string,
  backstageEvent: PropTypes.bool,
  colour: PropTypes.string,
};
