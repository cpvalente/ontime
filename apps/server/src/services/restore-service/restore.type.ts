import { Instant, Maybe, MaybeNumber, MaybeString, Playback } from 'ontime-types';

export type RestorePoint = {
  playback: Playback;
  selectedEventId: MaybeString;
  startedAt: MaybeNumber;
  addedTime: number;
  /** instant the playback was paused at */
  pausedAt: Maybe<Instant>;
  pausedDuration?: number;
  firstStart: MaybeNumber;
  startEpoch: Maybe<Instant>;
  currentDay: MaybeNumber;
};
