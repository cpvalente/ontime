import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import { stringFromMillis } from '../../../common/utils/time';

export default function Countdown(props) {
  const [searchParams] = useSearchParams();
  const { backstageEvents, time } = props;
  const [follow, setFollow] = useState(null);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Countdown';
  }, []);

  // eg. http://localhost:4001/countdown?eventId=ei0us
  // Check for user options
  useEffect(() => {
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
    console.log(time);
  }, [time]);

  const parseTitle = useCallback((title) => {
    if (title === null || title === '' || typeof title === 'undefined') {
      return '{no title}';
    } else {
      return title;
    }
  }, []);

  if (follow === null) {
    return (
      <div>
        Choose an event to follow
        <ul>
          {backstageEvents.map((event, index) => (
            <li key={event.id}>
              <Link to={`/countdown?eventid=${event.id}`}>
                {`${index + 1}. ${parseTitle(event.title)}`}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    return (
      <div>
        Following: {follow.title} <br />
        Time now: {time.clock} <br />
        Time now ms: {time.clockMs} <br />
        Event Starts at: {stringFromMillis(follow.timeStart)} <br />
        Event finishes at: {stringFromMillis(follow.timeEnd)} <br />
        Time to start: {stringFromMillis(follow.timeStart - time.clockMs)}<br />
        Time to finish {stringFromMillis(follow.timeEnd - time.clockMs)}:<br />
        Upcoming: {(time.clockMs < follow.timeStart) ? 'true' : 'false'} <br />
        Running: {(time.clockMs >= follow.timeStart && time.clockMs <= follow.timeEnd) ? 'true' : 'false'} <br />
        Passed: {(time.clockMs > follow.timeEnd) ? 'true' : 'false'} <br />
      </div>
    );
  }
}

Countdown.propTypes = {
  backstageEvents: PropTypes.array,
  time: PropTypes.object,
};
