import { OntimeEvent, Playback } from 'ontime-types';

import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';

export enum TimerMessage {
  toStart = 'to_start',
  waiting = 'waiting',
  running = 'running',
  ended = 'ended',
  unhandled = '',
}

/**
 * Parses string as a title
 */
export const sanitiseTitle = (title: string | null) => (title ? title : '{no title}');

/**
 * Returns a parsed timer and relevant status message
 */
export const fetchTimerData = (
  time: ViewExtendedTimer,
  follow: OntimeEvent,
  selectedId: string | null,
): { message: TimerMessage; timer: number } => {
  let message;
  let timer;

  if (selectedId === follow.id) {
    // check that is not running
    message = time.playback === Playback.Pause ? TimerMessage.waiting : TimerMessage.running;
    timer = time.current ?? 0;
  } else if (time.clock < follow.timeStart) {
    // if it hasnt started, we count to start
    message = TimerMessage.toStart;
    timer = follow.timeStart - time.clock;
  } else if (follow.timeStart <= time.clock && time.clock <= follow.timeEnd) {
    // if it has started, we show running timer
    message = TimerMessage.waiting;
    timer = time.current ?? 0;
  } else {
    // running timer timer is not the one we are following

    if (follow.timeStart > follow.timeEnd) {
      // ends day after

      if (follow.timeStart > time.clock) {
        // if it hasnt started, we count to start
        message = TimerMessage.toStart;
        timer = follow.timeStart - time.clock;
      } else if (follow.timeStart <= time.clock) {
        // if it has started, we show running timer
        message = TimerMessage.waiting;
        timer = time.current ?? 0;
      } else {
        // if it has ended, we show how long ago
        message = TimerMessage.ended;
        timer = follow.timeEnd;
      }
    } else {
      // if it has ended, we show how long ago
      message = TimerMessage.ended;
      timer = follow.timeEnd;
    }
  }
  return { message, timer };
};
