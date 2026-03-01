import type { OntimeDelay, OntimeEvent, OntimeGroup, OntimeMilestone } from 'ontime-types';
import { EndAction, SupportedEntry, TimeStrategy, TimerType } from 'ontime-types';

export const event: Omit<OntimeEvent, 'id' | 'cue'> = {
  type: SupportedEntry.Event,
  flag: false,
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

export const milestone: Omit<OntimeMilestone, 'id'> = {
  type: SupportedEntry.Milestone,
  cue: '',
  title: '',
  note: '',
  colour: '',
  custom: {},
  parent: null,
  // !==== RUNTIME METADATA ====! //
  revision: 0, // calculated at runtime
};

export const group: Omit<OntimeGroup, 'id'> = {
  type: SupportedEntry.Group,
  title: '',
  note: '',
  entries: [],
  targetDuration: null,
  colour: '',
  custom: {},
  // !==== RUNTIME METADATA ====! //
  revision: 0, // calculated at runtime
  timeStart: null, // calculated at runtime
  timeEnd: null, // calculated at runtime
  duration: 0, // calculated at runtime
  isFirstLinked: false, // calculated at runtime
};
