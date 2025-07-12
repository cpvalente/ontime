// runtime utils
export { validatePlayback } from './src/validate-action/validatePlayback.js';
export { isKnownTimerType, validateTimeStrategy } from './src/validate-events/validateEvent.js';
export { calculateDuration, getLinkedTimes, validateTimes } from './src/validate-times/validateTimes.js';

// rundown utils
export { sanitiseCue } from './src/cue-utils/cueUtils.js';
export { getCueCandidate } from './src/cue-utils/cueUtils.js';
export { generateId } from './src/generate-id/generateId.js';
export {
  getEventWithId,
  getFirstEvent,
  getFirstEventNormal,
  getFirstNormal,
  getLastEvent,
  getLastEventNormal,
  getLastNormal,
  getNext,
  getNextBlockNormal,
  getNextEvent,
  getNextEventNormal,
  getNextNormal,
  getPrevious,
  getPreviousEvent,
  getPreviousEventNormal,
  getPreviousNormal,
  getPreviousBlock,
  getPreviousBlockNormal,
  swapEventData,
} from './src/rundown-utils/rundownUtils.js';
export { getFirstRundown } from './src/rundown/rundown.utils.js';

// time format utils
export {
  dayInMs,
  maxDuration,
  MILLIS_PER_HOUR,
  MILLIS_PER_MINUTE,
  MILLIS_PER_SECOND,
  millisToSeconds,
  secondsInMillis,
} from './src/date-utils/conversionUtils.js';
export { isISO8601, isTimeString } from './src/date-utils/isTimeString.js';
export {
  formatFromMillis,
  millisToString,
  pad,
  removeLeadingZero,
  removeSeconds,
  removeTrailingZero,
} from './src/date-utils/timeFormatting.js';
export { parseUserTime } from './src/date-utils/parseUserTime.js';
export { isAlphanumeric, isAlphanumericWithSpace } from './src/regex-utils/isAlphanumeric.js';
export { isColourHex } from './src/regex-utils/isColourHex.js';
export { splitWhitespace } from './src/regex-utils/splitWhitespace.js';

export { customFieldLabelToKey, customKeyFromLabel } from './src/customField-utils/customFieldUtils.js';

// helpers from externals
export { deepmerge } from './src/externals/deepmerge.js';

// array utils
export { deleteAtIndex, insertAtIndex, mergeAtIndex, reorderArray } from './src/common/arrayUtils.js';
// object utils
export { getPropertyFromPath, isObjectEmpty } from './src/common/objectUtils.js';

// generic utilities
export { getErrorMessage } from './src/generic/generic.js';
export { obfuscate, unobfuscate } from './src/generic/generic.js';
export { isNumeric } from './src/types/types.js';

// model validation
export { validateEndAction, validateTimerType } from './src/validate-events/validateEvent.js';

// feature business logic

export { calculateTimeUntilStart } from './src/date-utils/calculateTimeUntilStart.js';

// feature business logic - rundown
export { checkIsNow } from './src/date-utils/checkIsNow.js';
export { checkIsNextDay } from './src/date-utils/checkIsNextDay.js';
export { getTimeFrom } from './src/date-utils/getTimeFrom.js';
export { isNewLatest } from './src/date-utils/isNewLatest.js';

// feature business logic - spreadsheet import
export {
  type ImportCustom,
  type ImportMap,
  type ImportOptions,
  defaultImportMap,
  isImportMap,
} from './src/feature/spreadsheet-import/spreadsheetImport.js';

export { isPlaybackActive } from './src/playback-utils/playbackstate.js';

//Colour
export {
  colourToHex,
  cssOrHexToColour,
  hexToColour,
  isLightColour,
  mixColours,
  CssColours,
} from './src/colour/colour.utils.js';
