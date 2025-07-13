import type { MaybeNumber } from '../../utils/utils.type.js';

export enum OffsetMode {
  Absolute = 'absolute',
  Relative = 'relative',
}

export type Runtime = {
  selectedEventIndex: MaybeNumber;
  numEvents: number;
  offset: number;
  relativeOffset: number;
  plannedStart: MaybeNumber;
  actualStart: MaybeNumber;
  plannedEnd: MaybeNumber;
  expectedEnd: MaybeNumber;
  offsetMode: OffsetMode;
};
