import React from 'react';
import { format, hoursToMilliseconds } from 'date-fns';
import PropTypes from 'prop-types';

import { stringFromMillis } from '../../utils/time';

import style from './Paginator.module.scss';

export default function TodayItem(props) {
  const { selected, timeStart, timeEnd, title, backstageEvent, colour, format12 } = props;

  // Format timers
  const start = format12
    ? format(timeStart - hoursToMilliseconds(1), "hh:mm")
    : stringFromMillis(timeStart, false);

  const end = format12
    ? format(timeEnd - hoursToMilliseconds(1), "hh:mm")
    : stringFromMillis(timeEnd, false);

  //const start = stringFromMillis(timeStart, false) || '';
  //const end = stringFromMillis(timeEnd, false) || '';

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
  format12: PropTypes.bool,
};
