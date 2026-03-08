import { Instant, Maybe, MaybeNumber, MaybeString, Playback } from 'ontime-types';

export type RestorePoint = {
  playback: Playback;
  selectedEventId: MaybeString;
  startedAt: MaybeNumber;
  addedTime: number;
  pausedAt: MaybeNumber;
  firstStart: MaybeNumber;
  startEpoch: Maybe<Instant>;
  currentDay: MaybeNumber;
};
