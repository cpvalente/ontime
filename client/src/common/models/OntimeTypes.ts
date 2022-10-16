export type Playstate = 'roll' | 'start' | 'pause' | 'stop';

export type TimeManager = {
  clock: number,
  running: number,
  isNegative: boolean;
  startedAt: null | number;
  expectedFinish: null | number;
  finished: boolean;
  playstate: Playstate
}

export type PresenterMessageData = {
  text: string;
  visible: boolean;
}

export type ViewSettings = {
  overrideStyles: boolean;
}