import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import TimerDisplay from '../../../common/components/countdown/TimerDisplay';
import NavLogo from '../../../common/components/nav/NavLogo';
import { millisToSeconds } from '../../../common/utils/dateConfig';
import { stringFromMillis } from '../../../common/utils/time';

import style from './Countdown.module.scss';

const timerMessages = {
  toStart: 'Count down to start time',
  running: 'Event running',
  ended: 'Event ended at',
};

export default function Countdown(props) {
  const [searchParams] = useSearchParams();
  const { backstageEvents, time } = props;
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

    if (eventId !== null) {
      const events = [...backstageEvents];
      const followThis = events.find((event) => event.id === eventId);
      if (typeof followThis !== 'undefined') {
        setFollow(followThis);
      }
    } else if (eventIndex !== null) {
      const events = [...backstageEvents];
      const followThis = events[eventIndex - 1];
      if (typeof followThis !== 'undefined') {
        setFollow(followThis);
      }
    }
  }, [backstageEvents, searchParams]);

  useEffect(() => {
    if (follow === null) {
      return;
    }

    if (time.clockMs < follow.timeStart) {
      // if it hasnt started, we count to start
      setRunningMessage(timerMessages.start);
      const t = millisToSeconds(follow.timeStart - time.clockMs);
      setRunningTimer(t);
    } else if (follow.timeStart <= time.clockMs && time.clockMs <= follow.timeEnd) {
      // if it has started, we show running timer
      setRunningMessage(timerMessages.running);
      setRunningTimer(time.running);
    } else {
      // if it has ended, we show how long ago
      setRunningMessage(timerMessages.ended);
      setRunningTimer(follow.timeEnd);
    }
  }, [follow, time]);

  const parseTitle = useCallback((title) => {
    if (title === null || title === '' || typeof title === 'undefined') {
      return '{no title}';
    } else {
      return title;
    }
  }, []);

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
                    {`${index + 1}. ${parseTitle(event.title)}`}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <>
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
          {runningMessage === timerMessages.ended ? (
            <span className={style.countdownClock}>{stringFromMillis(runningTimer)}</span>
          ) : (
            <TimerDisplay time={runningTimer} hideZeroHours />
          )}
          <div className={style.title}>{follow.title || 'no title'}</div>
        </>
      )}
    </div>
  );
}

Countdown.propTypes = {
  backstageEvents: PropTypes.array,
  time: PropTypes.object,
};

/*
Following: {follow.title} <br />
Time now: {time.clock} <br />
Time now ms: {time.clockMs} <br />
Start Time: {stringFromMillis(follow.timeStart)} <br />
End Time at: {stringFromMillis(follow.timeEnd)} <br />
Time to start: {stringFromMillis(follow.timeStart - time.clockMs)}<br />
Time to finish {stringFromMillis(follow.timeEnd - time.clockMs)}:<br />
Upcoming: {(time.clockMs < follow.timeStart) ? 'true' : 'false'} <br />
Running: {(time.clockMs >= follow.timeStart && time.clockMs <= follow.timeEnd) ? 'true' : 'false'}
<br />
Passed: {(time.clockMs > follow.timeEnd) ? 'true' : 'false'} <br />
*/
