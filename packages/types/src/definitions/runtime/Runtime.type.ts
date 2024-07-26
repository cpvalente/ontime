import type { MaybeNumber } from '../../utils/utils.type.js';

export type Runtime = {
  numEvents: number;
  selectedEventIndex: MaybeNumber;
  offset: number;
  plannedStart: MaybeNumber;
  actualStart: MaybeNumber;
  plannedEnd: MaybeNumber;
  expectedEnd: MaybeNumber;
};
