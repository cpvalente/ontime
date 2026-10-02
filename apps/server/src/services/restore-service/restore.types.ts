import { Instant, Maybe, MaybeNumber, MaybeString, OffsetMode, Playback } from 'ontime-types';

export type RestorePoint = {
  rundownId: string;
  playback: Playback;
  selectedEventId: MaybeString;
  startedAt: Maybe<Instant>;
  addedTime: number;
  pausedAt: Maybe<Instant>;
  pausedDuration?: number;
  /** when the rundown started, its time of day is the rundown's actual start */
  startEpoch: Maybe<Instant>;
  currentDay: MaybeNumber;
  offsetMode: OffsetMode;
};
