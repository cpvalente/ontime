import { Instant, Maybe, MaybeNumber, MaybeString, OffsetMode, Playback } from 'ontime-types';

export type RestorePoint = {
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
  savedAt: Instant;
};
