import type { MaybeNumber } from '../../utils/utils.type.js';

/**
 * Offset represents our current position in relation to the planned time
 * a positive value means that we have added extra time to the expected end
 * aka behind schedule
 */
export type Offset = {
  /** Current absolute offset: accounts for planned times, roll and hard outs follow it */
  absolute: number;
  /** Offset since the last reset, the absolute offset when there is none */
  relative: number;
  /** Timestamp of the expected start of the next flag */
  expectedGroupEnd: MaybeNumber;
  /** Timestamp of the expected end of the current group */
  expectedRundownEnd: MaybeNumber;
  /** Timestamp of the expected end of the loaded rundown */
  expectedFlagStart: MaybeNumber;
};
