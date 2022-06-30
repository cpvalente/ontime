import { millisToSeconds } from '../../../common/utils/dateConfig';

/**
 * @description parses string as a title
 * @param {string|null} title
 * @return {string}
 */
export const sanitiseTitle = (title) =>
  title === null || title === '' || typeof title === 'undefined' ? '{no title}' : title;

/**
 * @description object with possible timer messages
 * @type {{running: string, toStart: string, waiting: string, ended: string}}
 */
export const timerMessages = {
  toStart: 'Time to start',
  waiting: 'Waiting for event start',
  running: 'Event running',
  ended: 'Event ended at',
};

/**
 * @description Returns a parsed timer and relevant status message
 * @param {object} time
 * @param {object} follow
 * @param {string} selectedId
 * @return {{timer: number, message: string}}
 */
export const fetchTimerData = (time, follow, selectedId) => {
  let message = "";
  let timer = 0;

  if (selectedId === follow.id) {
    // check that is not running
    message = time.playstate === 'pause' ? timerMessages.waiting : timerMessages.running;
    timer = time.running;
  } else if (time.clockMs < follow.timeStart) {
    // if it hasnt started, we count to start
    message = timerMessages.toStart;
    timer = millisToSeconds(follow.timeStart - time.clockMs);
  } else if (follow.timeStart <= time.clockMs && time.clockMs <= follow.timeEnd) {
    // if it has started, we show running timer
    message = timerMessages.waiting;
    timer = time.running;
  } else {
    if (follow.timeStart > follow.timeEnd) {
      // ends day after
      if (follow.timeStart > time.clockMs ) {
        // if it hasnt started, we count to start
        message = timerMessages.toStart;
        timer = millisToSeconds(follow.timeStart - time.clockMs);
      } else if (follow.timeStart <= time.clockMs) {
        // if it has started, we show running timer
        message = timerMessages.waiting;
        timer = time.running;
      } else {
        // if it has ended, we show how long ago
        message = timerMessages.ended;
        timer = millisToSeconds(follow.timeEnd);
      }
    } else {
      // if it has ended, we show how long ago
      message = timerMessages.ended;
      timer = millisToSeconds(follow.timeEnd);
    }
  }
  return { message, timer };
};
