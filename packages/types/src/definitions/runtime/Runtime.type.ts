import type { MaybeNumber } from '../../utils/utils.type.js';

export enum OffsetMode {
  Absolute = 'absolute',
  Relative = 'relative',
}

export type Runtime = {
  selectedEventIndex: MaybeNumber;
  numEvents: number;
  offsetAbs: number;
  offsetRel: number;
  plannedStart: MaybeNumber;
  actualStart: MaybeNumber;
  plannedEnd: MaybeNumber;
  expectedEnd: MaybeNumber;
  offsetMode: OffsetMode;
};
