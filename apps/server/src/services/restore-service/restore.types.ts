import { Day, Duration, Instant, Maybe, MaybeString, OffsetMode, Playback, TimeOfDay } from 'ontime-types';

import type { AuxTimers } from '../aux-timer-service/auxTimer.utils.js';

/**
 * What the runtime saves to resume playback: the timer base
 * every other timer value follows from it and the clock
 */
export type RuntimeRestore = {
  rundownId: string;
  playback: Playback;
  selectedEventId: MaybeString;
  startedAt: Maybe<Instant>;
  pausedAt: Maybe<Instant>;
  /** time spent in pauses which have been resumed */
  pausedDuration: Duration;
  addedTime: Duration;
  startEpoch: Maybe<Instant>;
  /** rundown day playback started on */
  startDayOffset: Maybe<Day>;
  /** planned start of the event playback started from */
  startEventStart: Maybe<TimeOfDay>;
  /** rundown day of the event playback started from */
  startEventDay: Maybe<Day>;
  groupStartedAt: Maybe<Instant>;
  offsetMode: OffsetMode;
};

/** each part is missing until it is saved */
export type RestorePoint = {
  /** playback belongs to the project it was saved in */
  runtime?: RuntimeRestore & { projectId: string };
  /** aux timers outlive a project */
  auxTimers?: AuxTimers;
  savedAt: Instant;
};
