import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useFitText from 'use-fit-text';

import NavLogo from '../../../common/components/nav/NavLogo';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { formatDisplay } from '../../../common/utils/dateConfig';
import {
  formatEventList,
  getEventsWithDelay,
  trimEventlist,
} from '../../../common/utils/eventsManager';
import { formatTime, stringFromMillis } from '../../../common/utils/time';
import { overrideStylesURL } from '../../../ontimeConfig';

import './StudioClock.scss';

const formatOptions = {
  showSeconds: false,
  format: 'hh:mm',
};

export default function StudioClock(props) {
  const { title, time, backstageEvents, selectedId, nextId, onAir, viewSettings } = props;

  // deferring rendering seems to affect styling (font and useFitText)
  useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { fontSize: titleFontSize, ref: titleRef } = useFitText({ maxFontSize: 500 });

  const [schedule, setSchedule] = useState([]);

  const activeIndicators = [...Array(12).keys()];
  const secondsIndicators = [...Array(60).keys()];
  const MAX_TITLES = 10;

  useEffect(() => {
    document.title = 'ontime - Studio Clock';
  }, []);

  // Prepare event list
  useEffect(() => {
    if (backstageEvents == null) return;

    const delayed = getEventsWithDelay(backstageEvents);
    const events = delayed.filter((e) => e.type === 'event');
    const trimmed = trimEventlist(events, selectedId, MAX_TITLES);
    const formatted = formatEventList(trimmed, selectedId, nextId, {
      showEnd: false,
    });
    setSchedule(formatted);
  }, [backstageEvents, nextId, selectedId] );

  const clock = formatTime(time.clock, formatOptions);
  const [, , secondsNow] = stringFromMillis(time.clock).split(':');

  return (
    <div className='studio-clock'>
      <NavLogo />
      <div className='clock-container'>
        <div className='studio-timer'>{clock}</div>
        <div
          ref={titleRef}
          className='next-title'
          style={{ fontSize: titleFontSize, height: '10vh', width: '100%', maxWidth: '82%' }}
        >
          {title.titleNext}
        </div>
        <div className={time.isNegative ? 'next-countdown' : 'next-countdown next-countdown--overtime'}>
          {selectedId != null && formatDisplay(time.running)}
        </div>
        <div className='clock-indicators'>
          {activeIndicators.map((i) => (
            <div
              key={i}
              className='hours hours--active'
              style={{
                transform: `rotate(${(360 / 12) * i - 90}deg) translateX(40vh)`,
              }}
            />
          ))}
          {secondsIndicators.map((i) => (
            <div
              key={i}
              className={i <= secondsNow ? 'min min--active' : 'min'}
              style={{
                transform: `rotate(${(360 / 60) * i - 90}deg) translateX(43vh)`,
              }}
            />
          ))}
        </div>
      </div>
      <div className='schedule-container'>
        <div className={onAir ? 'onAir' : 'onAir onAir--idle'}>ON AIR</div>
        <div className='schedule'>
          <ul>
            {schedule.map((s) => (
              <li
                key={s.id}
                className={s.isNow ? 'now' : s.isNext ? 'next' : ''}
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
  viewSettings: PropTypes.object,
};
