/**
 * @description Milliseconds in a day
 */
export const DAY_TO_MS = 86400000;

/**
 * @description calculates duration from given values
 */
export const calculateDuration = (start: number, end: number): number =>
  start > end ? end + DAY_TO_MS - start : end - start;

/**
 * @description Checks which field the value relates to
 */
export const handleTimeEntry = (field: string, val: number, timeStart: number, timeEnd: number): {start: number, end: number, durationOverride: boolean} => {
  let start = timeStart;
  let end = timeEnd;
  let durationOverride = false;

  if (field === 'timeStart') {
    start = val;
  } else if (field === 'timeEnd') {
    end = val;
  } else {
    durationOverride = field === 'durationOverride';
  }
  return { start, end, durationOverride };
};

/**
 * @description Validates time entry
 */
export const validateEntry = (field: string, value: number, timeStart: number, timeEnd: number): { value: boolean, catch: string } => {
  const validate = { value: true, catch: '' };

  // 1. if one of times is not entered, anything goes
  if (value == null || timeStart == null || timeEnd == null) return validate;
  if (timeStart === 0) return validate;

  // 2. find out what's what
  const { start, end, durationOverride } = handleTimeEntry(field, value, timeStart, timeEnd);
  if (durationOverride !== null) {
    return validate;
  }

  // 3. validation rules
  if (start > end) {
    validate.catch = 'Start time later than end time';
  }
  return validate;
};
