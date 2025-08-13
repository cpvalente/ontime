import type { MaybeNumber } from '../../utils/utils.type.js';

export enum OffsetMode {
  Absolute = 'absolute',
  Relative = 'relative',
}

export type Offset = {
  absolute: number; // a positive value means that we are in over time aka behind schedule
  relative: number;
  mode: OffsetMode;
  expectedGroupEnd: MaybeNumber;
  expectedRundownEnd: MaybeNumber;
  expectedFlagStart: MaybeNumber;
};
