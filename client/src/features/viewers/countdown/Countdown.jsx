import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAtom } from 'jotai';
import PropTypes from 'prop-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { mirrorViewersAtom } from '../../../common/atoms/ViewerSettings';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import Empty from '../../../common/components/state/Empty';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { formatDisplay, millisToSeconds } from '../../../common/utils/dateConfig';
import getDelayTo from '../../../common/utils/getDelayTo';
import { formatTime } from '../../../common/utils/time';

import { fetchTimerData, sanitiseTitle, timerMessages } from './countdown.helpers';

import './Countdown.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

export default function Countdown(props) {
  const { backstageEvents, time, selectedId, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();
  const [isMirrored] = useAtom(mirrorViewersAtom);

  const [follow, setFollow] = useState(null);
  const [runningTimer, setRunningTimer] = useState(0);
  const [runningMessage, setRunningMessage] = useState('');
  const [delay, setDelay] = useState(0);

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

    let followThis;
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

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const standby = time.playstate !== 'start' && selectedId === follow?.id;
  const isRunningFinished = time.finished && runningMessage === timerMessages.running;
  const isSelected = runningMessage === timerMessages.running;
  const delayedTimerStyles = delay > 0 ? 'aux-timers__value--delayed' : '';

  const clock = formatTime(time.clock, formatOptions);
  const startTime =
    follow === null
      ? '...'
      : formatTime(follow.timeStart + delay, formatOptions);
  const endTime =
    follow === null
      ? '...'
      : formatTime(follow.timeEnd + delay, formatOptions);

  return (
    <div className={`countdown ${isMirrored ? 'mirror' : ''}`} data-testid='countdown-view'>
      <NavigationMenu />
      {follow === null ? (
        <div className='event-select' data-testid='countdown-select'>
          <span className='event-select__title'>Select an event to follow</span>
          <ul className='event-select__events'>
            {backstageEvents.length === 0 ? (
              <Empty text='No events in database' />
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
        <div className='countdown-container' data-testid='countdown-event'>
          <div className='timer-group'>
            <div className='aux-timers'>
              <div className='aux-timers__label'>Time Now</div>
              <span className='aux-timers__value'>{clock}</span>
            </div>
            <div className='aux-timers'>
              <div className='aux-timers__label'>Start Time</div>
              <span className={`aux-timers__value ${delayedTimerStyles}`}>
                {startTime}
              </span>
            </div>
            <div className='aux-timers'>
              <div className='aux-timers__label'>End Time</div>
              <span className={`aux-timers__value ${delayedTimerStyles}`}>
                {endTime}
              </span>
            </div>
          </div>
          <div className='status'>{runningMessage}</div>
          <span
            className={`timer ${standby ? 'timer--paused' : ''} ${
              isRunningFinished ? 'timer--finished' : ''
            }`}
          >
            {formatDisplay(
              isSelected ? runningTimer : runningTimer + millisToSeconds(delay),
              isSelected || time.waiting,
            )}
          </span>
          <div className='title'>{follow?.title || 'Untitled Event'}</div>
        </div>
      )}
    </div>
  );
}

Countdown.propTypes = {
  backstageEvents: PropTypes.array,
  time: PropTypes.object,
  selectedId: PropTypes.string,
  viewSettings: PropTypes.object,
};
