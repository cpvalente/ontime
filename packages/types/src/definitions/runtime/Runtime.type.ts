import type { MaybeNumber } from '../../utils/utils.type.js';

export enum OffsetMode {
  Absolute = 'absolute',
  Relative = 'relative',
}

export type Runtime = {
  offsetAbs: number; // a positive value means that we are in over time aka behind schedule
  offsetRel: number;
  offsetMode: OffsetMode;
  expectedGroupEnd: MaybeNumber;
  expectedRundownEnd: MaybeNumber;
  expectedFlagStart: MaybeNumber;
};
