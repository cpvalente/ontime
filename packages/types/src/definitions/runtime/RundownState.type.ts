import type { MaybeNumber } from '../../utils/utils.type.js';

export type RundownState = {
  selectedEventIndex: MaybeNumber;
  numEvents: number;
  plannedStart: MaybeNumber;
  actualStart: MaybeNumber;
  plannedEnd: MaybeNumber;
};
