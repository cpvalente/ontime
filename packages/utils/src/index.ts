// runtime utils
export { validatePlayback } from './validate-action/validatePlayback.js';
export { isKnownTimerType, validateTimeStrategy } from './validate-events/validateEvent.js';
export { calculateDuration, getLinkedTimes, validateTimes } from './validate-times/validateTimes.js';

// rundown utils
export { sanitiseCue } from './cue-utils/cueUtils.js';
export { getCueCandidate } from './cue-utils/cueUtils.js';
export { generateId } from './generate-id/generateId.js';
export {
  getEventWithId,
  getFirstEvent,
  getFirstEventNormal,
  getFirstNormal,
  getLastEvent,
  getLastEventNormal,
  getLastNormal,
  getNext,
  getNextGroupNormal,
  getNextEvent,
  getNextEventNormal,
  getNextNormal,
  getPrevious,
  getPreviousEvent,
  getPreviousEventNormal,
  getPreviousNormal,
  getPreviousGroup,
  getPreviousGroupNormal,
  swapEventData,
} from './rundown-utils/rundownUtils.js';
export { getFirstRundown } from './rundown/rundown.utils.js';

// time format utils
export {
  dayInMs,
  maxDuration,
  MILLIS_PER_HOUR,
  MILLIS_PER_MINUTE,
  MILLIS_PER_SECOND,
  millisToSeconds,
  secondsInMillis,
} from './date-utils/conversionUtils.js';
export { isISO8601, isTimeString } from './date-utils/isTimeString.js';
export {
  formatFromMillis,
  millisToString,
  pad,
  removeLeadingZero,
  removeSeconds,
  removeTrailingZero,
} from './date-utils/timeFormatting.js';
export { parseUserTime } from './date-utils/parseUserTime.js';
export { checkRegex, regex } from './regex-utils/checkRegex.js';
export { isColourHex } from './regex-utils/isColourHex.js';
export { splitWhitespace } from './regex-utils/splitWhitespace.js';

export { customFieldLabelToKey, customKeyFromLabel } from './customField-utils/customFieldUtils.js';

// helpers from externals
export { deepmerge } from './externals/deepmerge.js';

// array utils
export { deleteAtIndex, insertAtIndex, mergeAtIndex, reorderArray } from './common/arrayUtils.js';
// object utils
export { getPropertyFromPath, isObjectEmpty } from './common/objectUtils.js';

// generic utilities
export { getErrorMessage } from './generic/generic.js';
export { obfuscate, unobfuscate } from './generic/generic.js';
export { isNumeric } from './types/types.js';

// model validation
export { validateEndAction, validateTimerType } from './validate-events/validateEvent.js';

// feature business logic

export { getExpectedStart } from './date-utils/getExpectedStart.js';

// feature business logic - rundown
export { checkIsNow } from './date-utils/checkIsNow.js';
export { checkIsNextDay } from './date-utils/checkIsNextDay.js';
export { getTimeFrom } from './date-utils/getTimeFrom.js';
export { isNewLatest } from './date-utils/isNewLatest.js';

// feature business logic - spreadsheet import
export {
  type ImportCustom,
  type ImportMap,
  type ImportOptions,
  defaultImportMap,
  isImportMap,
} from './feature/spreadsheet-import/spreadsheetImport.js';

export { isPlaybackActive } from './playback-utils/playbackstate.js';

//Colour
export {
  colourToHex,
  cssOrHexToColour,
  hexToColour,
  isLightColour,
  mixColours,
  CssColours,
} from './colour/colour.utils.js';
