import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useFitText from 'use-fit-text';

import NavLogo from '../../../common/components/nav/NavLogo';
import { formatDisplay } from '../../../common/utils/dateConfig';
import {
  formatEventList,
  getEventsWithDelay,
  trimEventlist,
} from '../../../common/utils/eventsManager';

import style from './StudioClock.module.scss';

export default function StudioClock(props) {
  const { title, time, backstageEvents, selectedId, nextId, onAir } = props;
  const { fontSize, ref } = useFitText({ maxFontSize: 500 });
  const [, , secondsNow] = time.clock.split(':');
  const [schedule, setSchedule] = useState([]);

  const activeIndicators = [...Array(12).keys()];
  const secondsIndicators = [...Array(60).keys()];
  const MAX_TITLES = 10;

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Studio Clock';
  }, []);

  // Prepare event list
  // Todo: useMemo()
  useEffect(() => {
    if (backstageEvents == null) return;

    const delayed = getEventsWithDelay(backstageEvents);
    const events = delayed.filter((e) => e.type === 'event');
    const trimmed = trimEventlist(events, selectedId, MAX_TITLES);
    const formatted = formatEventList(trimmed, selectedId, nextId);
    setSchedule(formatted);
  }, [backstageEvents, selectedId, nextId]);

  return (
    <div className={style.container}>
      <NavLogo />
      <div className={style.clockContainer}>
        <div className={style.time}>{time.clockNoSeconds}</div>
        <div
          ref={ref}
          className={style.nextTitle}
          style={{ fontSize, height: '10vh', width: '100%', maxWidth: '82%' }}
        >
          {title.titleNext}
        </div>
        <div className={time.isNegative ? style.nextCountdown : style.nextCountdown__overtime}>
          {selectedId != null && formatDisplay(time.running)}
        </div>
        <div className={style.indicators}>
          {activeIndicators.map((i) => (
            <div
              key={i}
              className={style.hours__active}
              style={{
                transform: `rotate(${(360 / 12) * i - 90}deg) translateX(40vh)`,
              }}
            />
          ))}
          {secondsIndicators.map((i) => (
            <div
              key={i}
              className={i <= secondsNow ? style.min__active : style.min}
              style={{
                transform: `rotate(${(360 / 60) * i - 90}deg) translateX(43vh)`,
              }}
            />
          ))}
        </div>
      </div>
      <div className={style.scheduleContainer}>
        <div className={onAir ? style.onAir : style.onAir__idle}>ON AIR</div>
        <div className={style.schedule}>
          <ul>
            {schedule.map((s) => (
              <li
                key={s.id}
                className={s.isNow ? style.now : s.isNext ? style.next : ''}
                style={{ borderLeft: `4px solid ${s.colour !== '' ? s.colour : 'transparent'}` }}
              >
                {`${s.time} ${s.title}`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

StudioClock.propTypes = {
  title: PropTypes.object,
  time: PropTypes.object,
  backstageEvents: PropTypes.array,
  selectedId: PropTypes.string,
  nextId: PropTypes.string,
  onAir: PropTypes.bool,
};
