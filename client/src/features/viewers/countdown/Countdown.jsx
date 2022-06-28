import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import NavLogo from '../../../common/components/nav/NavLogo';
import { formatDisplay } from '../../../common/utils/dateConfig';
import { stringFromMillis } from '../../../common/utils/time';

import { fetchTimerData, sanitiseTitle } from './countdown.helpers';

import style from './Countdown.module.scss';

export default function Countdown(props) {
  const [searchParams] = useSearchParams();
  const { backstageEvents, time, selectedId } = props;
  const [follow, setFollow] = useState(null);
  const [runningTimer, setRunningTimer] = useState(0);
  const [runningMessage, setRunningMessage] = useState('');

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Countdown';
  }, []);

  // eg. http://localhost:4001/countdown?eventId=ei0us
  // Check for user options
  useEffect(() => {
    if (!backstageEvents) {
      return;
    }

    const eventId = searchParams.get('eventid');
    const eventIndex = searchParams.get('event');

    let followThis = undefined;
    const events = [...backstageEvents];

    if (eventId !== null) {
      followThis = events.find((event) => event.id === eventId);
    } else if (eventIndex !== null) {
      followThis = events?.[eventIndex - 1];
    }
    if (typeof followThis !== 'undefined') {
      setFollow(followThis);
    }
  }, [backstageEvents, searchParams]);

  useEffect(() => {
    if (follow === null) {
      return;
    }

    const { message, timer } = fetchTimerData(time, follow, selectedId);
    setRunningMessage(message);
    setRunningTimer(timer);
  }, [follow, selectedId, time]);

  const standby = time.playstate !== 'start' && selectedId === follow?.id;

  return (
    <div className={style.container}>
      <NavLogo />
      {follow === null ? (
        <div className={style.eventSelect}>
          <span className={style.actionTitle}>Select an event to follow</span>
          <ul className={style.events}>
            {backstageEvents
              .filter((e) => e.type === 'event')
              .map((event, index) => (
                <li key={event.id}>
                  <Link to={`/countdown?eventid=${event.id}`}>
                    {`${index + 1}. ${sanitiseTitle(event.title)}`}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <div className={style.countdownContainer}>
          <div className={style.timers}>
            <div className={style.timer}>
              <div className={style.label}>Time Now</div>
              <span className={style.value}>{time.clock}</span>
            </div>
            <div className={style.timer}>
              <div className={style.label}>Start Time</div>
              <span className={style.value}>{stringFromMillis(follow.timeStart)}</span>
            </div>
            <div className={style.timer}>
              <div className={style.label}>End Time</div>
              <span className={style.value}>{stringFromMillis(follow.timeEnd)}</span>
            </div>
          </div>
          <div className={style.status}>{runningMessage}</div>
          <span className={`${style.countdownClock} ${standby ? style.standby: ''}`}>
            {formatDisplay(runningTimer, time.running || time.waiting)}
          </span>
          <div className={style.title}>{follow.title || 'Untitled Event'}</div>
        </div>
      )}
    </div>
  );
}

Countdown.propTypes = {
  backstageEvents: PropTypes.array,
  time: PropTypes.object,
  selectedId: PropTypes.string,
};
