import type { MaybeNumber } from '../../utils/utils.type.js';

export enum OffsetMode {
  Absolute = 'absolute',
  Relative = 'relative',
}

export type Runtime = {
  selectedEventIndex: MaybeNumber;
  numEvents: number;
  offsetAbs: number; // a positive value means that we are in over time aka behind schedule
  offsetRel: number;
  plannedStart: MaybeNumber;
  actualStart: MaybeNumber;
  plannedEnd: MaybeNumber;
  expectedEnd: MaybeNumber;
  offsetMode: OffsetMode;
};
