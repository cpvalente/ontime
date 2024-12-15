import {
  EndAction,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  SupportedEvent,
  TimeStrategy,
  TimerType,
} from 'ontime-types';

export const event: Omit<OntimeEvent, 'id' | 'delay' | 'cue'> = {
  title: '',
  note: '',
  endAction: EndAction.None,
  timerType: TimerType.CountDown,
  timeStrategy: TimeStrategy.LockDuration,
  linkStart: null,
  isTimeToEnd: false,
  timeStart: 0,
  timeEnd: 0,
  duration: 0,
  isPublic: false,
  skip: false,
  colour: '',
  type: SupportedEvent.Event,
  revision: 0,
  timeWarning: 120000,
  timeDanger: 60000,
  custom: {},
};

export const delay: Omit<OntimeDelay, 'id'> = {
  duration: 0,
  type: SupportedEvent.Delay,
};

export const block: Omit<OntimeBlock, 'id'> = {
  title: '',
  type: SupportedEvent.Block,
};
