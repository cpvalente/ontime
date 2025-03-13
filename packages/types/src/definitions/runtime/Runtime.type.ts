import type { MaybeNumber } from '../../utils/utils.type.js';

export enum OffsetMode {
  Absolute = 'absolute',
  Relative = 'relative',
}

export type Runtime = {
  numEvents: number;
  selectedEventIndex: MaybeNumber;
  offset: number;
  relativeOffset: number;
  plannedStart: MaybeNumber;
  actualStart: MaybeNumber;
  plannedEnd: MaybeNumber;
  expectedEnd: MaybeNumber;
  offsetMode: OffsetMode;
};
