import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import NavLogo from '../../../common/components/nav/NavLogo';
import Empty from '../../../common/components/state/Empty';
import { formatDisplay, millisToSeconds } from '../../../common/utils/dateConfig';
import getDelayTo from '../../../common/utils/getDelayTo';
import { stringFromMillis } from '../../../common/utils/time';

import { fetchTimerData, sanitiseTitle, timerMessages } from './countdown.helpers';

import './Countdown.scss';

export default function Countdown(props) {
  const [searchParams] = useSearchParams();
  const { backstageEvents, time, selectedId } = props;
  const [follow, setFollow] = useState(null);
  const [runningTimer, setRunningTimer] = useState(0);
  const [runningMessage, setRunningMessage] = useState('');
  const [delay, setDelay] = useState(0);

  // Set window title
  document.title = 'ontime - Countdown';

  // eg. http://localhost:4001/countdown?eventId=ei0us
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
      const delay = getDelayTo(backstageEvents, idx);
      setDelay(delay);
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
  const delayedTimerStyles = delay > 0 ? 'aux-timers__value--delayed' : ''

  return (
    <div className='container'>
      <NavLogo />
      {follow === null ? (
        <div className='event-select'>
          <span className='event-select__title'>Select an event to follow</span>
          <ul className='event-select__events'>
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
        <div className='countdown-container'>
          <div className='timer-group'>
            <div className='aux-timers'>
              <div className='aux-timers__label'>Time Now</div>
              <span className='aux-timers__value'>{time.clock}</span>
            </div>
            <div className='aux-timers'>
              <div className='aux-timers__label'>Start Time</div>
              <span className={`aux-timers__value ${delayedTimerStyles}`}>
                {stringFromMillis(follow.timeStart + delay)}
              </span>
            </div>
            <div className='aux-timers'>
              <div className='aux-timers__label'>End Time</div>
              <span className={`aux-timers__value ${delayedTimerStyles}`}>
                {stringFromMillis(follow.timeEnd + delay)}
              </span>
            </div>
          </div>
          <div className='status'>{runningMessage}</div>
          <span
            className={`countdown-clock ${standby ? 'countdown-clock--standby' : ''} ${
              isRunningFinished ? 'countdown-clock--finished' : ''
            }`}
          >
            {formatDisplay(
              isSelected ? runningTimer : runningTimer + millisToSeconds(delay),
              isSelected || time.waiting
            )}
          </span>
          <div className='title'>{follow.title || 'Untitled Event'}</div>
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
