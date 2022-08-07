import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import useFitText from 'use-fit-text';

import NavLogo from '../../../common/components/nav/NavLogo';
import { formatDisplay } from '../../../common/utils/dateConfig';
import {
  formatEventList,
  getEventsWithDelay,
  trimEventlist,
} from '../../../common/utils/eventsManager';
import { formatTime, stringFromMillis } from '../../../common/utils/time';

import style from './StudioClock.module.scss';

export default function StudioClock(props) {
  const { title, time, backstageEvents, selectedId, nextId, onAir, settings } = props;
  const { fontSize: titleFontSize, ref: titleRef } = useFitText({ maxFontSize: 500 });
  const [schedule, setSchedule] = useState([]);
  const [localTimeFormat, setLocalTimeFormat] = useState(null);
  const [searchParams] = useSearchParams();

  const activeIndicators = [...Array(12).keys()];
  const secondsIndicators = [...Array(60).keys()];
  const MAX_TITLES = 10;

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Studio Clock';
  }, []);

  // eg. http://localhost:3000/studio?fprmat=12
  // Check for user options
  useEffect(() => {
    // format: selector
    // Should be '12' or '24'
    const format = searchParams.get('format');
    if (format === '12' || format === '24') {
      setLocalTimeFormat(format);
    }
  }, [searchParams]);

  // Prepare event list
  // Todo: useMemo()
  useEffect(() => {
    if (backstageEvents == null) return;

    let format12 = false;
    if (localTimeFormat) {
      if (localTimeFormat === '12') {
        format12 = true;
      }
    } else if (settings.timeFormat) {
      if (settings.timeFormat === '12') {
        format12 = true;
      }
    }

    const delayed = getEventsWithDelay(backstageEvents);
    const events = delayed.filter((e) => e.type === 'event');
    const trimmed = trimEventlist(events, selectedId, MAX_TITLES);
    const formatted = formatEventList(trimmed, selectedId, nextId, {
      showEnd: false,
      format12,
    });
    setSchedule(formatted);
  }, [backstageEvents, selectedId, nextId, localTimeFormat, settings.timeFormat]);

  const clock = useMemo(() => {
    return localTimeFormat
      ? formatTime(time.clock, localTimeFormat === '12')
      : formatTime(time.clock, settings.timeFormat === '12');
  }, [localTimeFormat, settings.timeFormat, time.clock]);
  const [, , secondsNow] = stringFromMillis(time.clock).split(':');

  return (
    <div className={style.container}>
      <NavLogo />
      <div className={style.clockContainer}>
        <div className={style.time}>{clock}</div>
        <div
          ref={titleRef}
          className={style.nextTitle}
          style={{ fontSize: titleFontSize, height: '10vh', width: '100%', maxWidth: '82%' }}
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
  settings: PropTypes.object,
};
