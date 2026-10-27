import { Instant, Maybe, MaybeNumber, MaybeString, OffsetMode, Playback } from 'ontime-types';

import type { AuxTimers } from '../aux-timer-service/auxTimer.utils.js';

/** what the runtime saves to resume playback */
export type RuntimeRestore = {
  rundownId: string;
  playback: Playback;
  selectedEventId: MaybeString;
  startedAt: MaybeNumber;
  addedTime: number;
  pausedAt: MaybeNumber;
  pausedDuration?: number;
  firstStart: MaybeNumber;
  startEpoch: Maybe<Instant>;
  currentDay: MaybeNumber;
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
