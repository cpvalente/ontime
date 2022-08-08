import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import NavLogo from '../../../common/components/nav/NavLogo';
import Empty from '../../../common/components/state/Empty';
import { formatDisplay, millisToSeconds } from '../../../common/utils/dateConfig';
import getDelayTo from '../../../common/utils/getDelayTo';
import { formatTime } from '../../../common/utils/time';

import { fetchTimerData, sanitiseTitle, timerMessages } from './countdown.helpers';

import style from './Countdown.module.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

export default function Countdown(props) {
  const { backstageEvents, time, selectedId, settings } = props;
  const [follow, setFollow] = useState(null);
  const [runningTimer, setRunningTimer] = useState(0);
  const [runningMessage, setRunningMessage] = useState('');
  const [delay, setDelay] = useState(0);
  const [searchParams] = useSearchParams();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Countdown';
  }, []);

  // eg. http://localhost:4001/countdown?eventId=ei0us&format=12
  // Check for user options
  useEffect(() => {
    if (!backstageEvents) {
      return;
    }

    const eventId = searchParams.get('eventid');
    const eventIndex = searchParams.get('event');

    let followThis = undefined;
    const events = [...backstageEvents].filter((event) => event.type === 'event');

    if (eventId !== null) {
      followThis = events.find((event) => event.id === eventId);
    } else if (eventIndex !== null) {
      followThis = events?.[eventIndex - 1];
    }
    if (typeof followThis !== 'undefined') {
      setFollow(followThis);
      const idx = backstageEvents.findIndex((event) => event.id === followThis.id);
      const delayToEvent = getDelayTo(backstageEvents, idx);
      setDelay(delayToEvent);
    }
  }, [backstageEvents, searchParams]);

  useEffect(() => {
    if (!follow) {
      return;
    }

    const { message, timer } = fetchTimerData(time, follow, selectedId);
    setRunningMessage(message);
    setRunningTimer(timer);
  }, [follow, selectedId, time]);

  const standby = useMemo(
    () => time.playstate !== 'start' && selectedId === follow?.id,
    [follow?.id, selectedId, time.playstate]
  );

  const isRunningFinished = useMemo(
    () => time.finished && runningMessage === timerMessages.running,
    [time.finished, runningMessage]
  );

  const isSelected = useMemo(() => runningMessage === timerMessages.running, [runningMessage]);

  // eg. http://localhost:3000/sm?fprmat=12
  // format: selector
  // Should be '12' or '24'
  const timeFormat = searchParams.get('format') || settings.timeFormat;

  const clock = formatTime(time.clock, timeFormat === '12', formatOptions);
  const startTime =
    follow === null
      ? '...'
      : formatTime(follow.timeStart + delay, timeFormat === '12', formatOptions);
  const endTime =
    follow === null
      ? '...'
      : formatTime(follow.timeEnd + delay, timeFormat === '12', formatOptions);

  return (
    <div className={style.container}>
      <NavLogo />
      {follow === null ? (
        <div className={style.eventSelect}>
          <span className={style.actionTitle}>Select an event to follow</span>
          <ul className={style.events}>
            {backstageEvents.length === 0 ? (
              <Empty dark text='No events in database' />
            ) : (
              backstageEvents
                .filter((e) => e.type === 'event')
                .map((event, index) => (
                  <li key={event.id}>
                    <Link to={`/countdown?eventid=${event.id}`}>
                      {`${index + 1}. ${sanitiseTitle(event.title)}`}
                    </Link>
                  </li>
                ))
            )}
          </ul>
        </div>
      ) : (
        <div className={style.countdownContainer}>
          <div className={style.timers}>
            <div className={style.timer}>
              <div className={style.label}>Time Now</div>
              <span className={style.value}>{clock}</span>
            </div>
            <div className={style.timer}>
              <div className={style.label}>Start Time</div>
              <span className={`${style.value} ${delay > 0 ? style.delayed : ''}`}>
                {startTime}
              </span>
            </div>
            <div className={style.timer}>
              <div className={style.label}>End Time</div>
              <span className={`${style.value} ${delay > 0 ? style.delayed : ''}`}>{endTime}</span>
            </div>
          </div>
          <div className={style.status}>{runningMessage}</div>
          <span
            className={`${style.countdownClock} ${standby ? style.standby : ''} ${
              isRunningFinished ? style.finished : ''
            }`}
          >
            {formatDisplay(
              isSelected ? runningTimer : runningTimer + millisToSeconds(delay),
              isSelected || time.waiting
            )}
          </span>
          <div className={style.title}>{follow?.title || 'Untitled Event'}</div>
        </div>
      )}
    </div>
  );
}

Countdown.propTypes = {
  backstageEvents: PropTypes.array,
  time: PropTypes.object,
  selectedId: PropTypes.string,
  settings: PropTypes.object,
};
