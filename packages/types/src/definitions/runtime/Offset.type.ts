import type { MaybeNumber } from '../../utils/utils.type.js';

export enum OffsetMode {
  Absolute = 'absolute',
  Relative = 'relative',
}

/**
 * Offset represents our current position in relation to the planned time
 * a positive value means that we have added extra time to the expected end
 * aka behind schedule
 */
export type Offset = {
  /** Current absolute offset: accounts for planned times */
  absolute: number;
  /** Current relative offset: only counts for generated offset since start */
  relative: number;
  /** Currently selected offset mode */
  mode: OffsetMode;
  /** Timestamp of the expected start of the next flag */
  expectedGroupEnd: MaybeNumber;
  /** Timestamp of the expected end of the current group */
  expectedRundownEnd: MaybeNumber;
  /** Timestamp of the expected end of the loaded rundown */
  expectedFlagStart: MaybeNumber;
};
