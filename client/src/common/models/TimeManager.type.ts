import { Playback } from './OntimeTypes';

export type TimeManagerType = {
  clock: number,
  running: number,
  isNegative: boolean;
  startedAt: null | number;
  expectedFinish: null | number;
  finished: boolean;
  playback: Playback
}
