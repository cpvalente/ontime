import { Playback, MaybeString, MaybeNumber, Maybe, EpochMs } from 'ontime-types';

export type RestorePoint = {
  playback: Playback;
  selectedEventId: MaybeString;
  startedAt: MaybeNumber;
  addedTime: number;
  pausedAt: MaybeNumber;
  firstStart: MaybeNumber;
  startEpoch: Maybe<EpochMs>;
};
