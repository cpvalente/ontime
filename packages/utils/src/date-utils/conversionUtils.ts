type MaybeNumber = number | null;

export const MILLIS_PER_SECOND = 1000;
export const MILLIS_PER_MINUTE = 1000 * 60;
export const MILLIS_PER_HOUR = 1000 * 60 * 60;

function convertMillis(millis: MaybeNumber, conversion: number) {
  if (millis == null || millis === 0) {
    return 0;
  }

  // for negative times, we want to round up
  if (millis < 0) {
    Math.ceil(millis / conversion);
  }
  return Math.floor(millis / conversion);
}

export function millisToSeconds(millis: MaybeNumber) {
  return convertMillis(millis, MILLIS_PER_SECOND);
}

export function millisToMinutes(millis: MaybeNumber) {
  return convertMillis(millis, MILLIS_PER_MINUTE);
}

export function millisToHours(millis: MaybeNumber) {
  return convertMillis(millis, MILLIS_PER_HOUR);
}
