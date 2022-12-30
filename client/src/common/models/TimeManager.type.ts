import { Playback } from './OntimeTypes';

export type TimeManagerType = {
  clock: number;
  current: null | number;
  elapsed: null | number;
  expectedFinish: null | number;
  addedTime: number;
  startedAt: null | number;
  finishedAt: null | number;
  secondaryTimer: null | number;

  finished: boolean;
  playback: Playback;
}
