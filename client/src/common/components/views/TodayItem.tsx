import PropTypes from 'prop-types';

import { formatTime } from '../../utils/time';

import style from './Paginator.module.scss';

interface TodayItemProps {
  selected: number;
  timeStart: number;
  timeEnd: number;
  title: string;
  backstageEvent: boolean;
  colour: string;
  skip: boolean;
}

// Todo: apply skip CSS and selector
export default function TodayItem(props: TodayItemProps) {
  // @ts-ignore
  const { selected, timeStart, timeEnd, title, backstageEvent, colour, skip } = props;

  // Format timers
  const start = formatTime(timeStart, { format: 'hh:mm' });
  const end = formatTime(timeEnd, { format: 'hh:mm' });

  // user colours
  const userColour = colour !== '' ? colour : 'transparent';

  // select styling
  let selectStyle = style.entryPast;
  if (selected === 1) selectStyle = style.entryNow;
  else if (selected === 2) selectStyle = style.entryFuture;
  return (
    <div className={selectStyle} style={{ borderLeft: `4px solid ${userColour}` }}>
      <div className={`${style.entryTimes} ${backstageEvent ? style.backstage : ''}`}>
        {`${start} · ${end}`}
      </div>
      <div className={style.entryTitle}>{title}</div>
      {backstageEvent && <div className={style.backstageInd} />}
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
