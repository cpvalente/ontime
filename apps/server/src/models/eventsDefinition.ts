import {
  EndAction,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  SupportedEntry,
  TimeStrategy,
  TimerType,
} from 'ontime-types';

export const event: Omit<OntimeEvent, 'id' | 'cue'> = {
  type: SupportedEntry.Event,
  title: '',
  note: '',
  endAction: EndAction.None,
  timerType: TimerType.CountDown,
  timeStrategy: TimeStrategy.LockDuration,
  linkStart: false,
  countToEnd: false,
  timeStart: 0,
  timeEnd: 0,
  duration: 0,
  skip: false,
  colour: '',
  timeWarning: 120000,
  timeDanger: 60000,
  triggers: [],
  custom: {},
  // !==== RUNTIME METADATA ====! //
  parent: null,
  revision: 0, // calculated at runtime
  delay: 0, // calculated at runtime
  dayOffset: 0, // calculated at runtime
  gap: 0, // calculated at runtime
};

export const delay: Omit<OntimeDelay, 'id'> = {
  type: SupportedEntry.Delay,
  duration: 0,
  parent: null,
};

export const block: Omit<OntimeBlock, 'id'> = {
  type: SupportedEntry.Block,
  title: '',
  note: '',
  events: [],
  skip: false,
  colour: '',
  custom: {},
  // !==== RUNTIME METADATA ====! //
  revision: 0, // calculated at runtime
  startTime: null, // calculated at runtime
  endTime: null, // calculated at runtime
  duration: 0, // calculated at runtime
  isFirstLinked: false, // calculated at runtime
};
