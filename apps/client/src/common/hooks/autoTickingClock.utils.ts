import { dayInMs, MILLIS_PER_SECOND } from 'ontime-utils';

/** How long a server sample can hold the estimate ahead of later, more delayed, samples */
export const sampleWindowMs = 5000;
/** Fraction of elapsed time used to correct drift: the displayed clock runs between 0.75x and 1.25x speed */
export const slewRate = 0.25;
/** Differences larger than this are a change in the server clock, not drift */
export const snapThresholdMs = MILLIS_PER_SECOND;
/** A server clock behind ours must stay behind this long before we snap back, late packets arrive in bursts */
export const backwardSnapDelayMs = MILLIS_PER_SECOND;
/** Draws slightly after the second change so the new second is visible */
const tickMarginMs = 10;

type ClockSample = { offset: number; receivedAt: number };

/**
 * Offset between the server clock and the local monotonic time (eg: performance.now())
 * Offsets are kept continuous across midnight, only the derived clock is wrapped to a day
 */
export type ClockEstimate = {
  samples: ClockSample[];
  /** applied offset when the current correction started */
  slewFrom: number;
  slewStart: number;
  /** offset the applied offset is moving towards */
  targetOffset: number;
  /** local time of the first sample in the current run of samples far behind the estimate */
  behindSince: number | null;
};

/** Signed difference between two times of day, taking the shortest way around midnight */
function wrapDifference(difference: number): number {
  const halfDay = dayInMs / 2;
  return ((((difference + halfDay) % dayInMs) + dayInMs) % dayInMs) - halfDay;
}

function getAppliedOffset(estimate: ClockEstimate, now: number): number {
  const maxCorrection = slewRate * Math.max(0, now - estimate.slewStart);
  const pending = estimate.targetOffset - estimate.slewFrom;
  return estimate.slewFrom + Math.max(-maxCorrection, Math.min(maxCorrection, pending));
}

function createClockEstimate(serverClock: number, now: number): ClockEstimate {
  const offset = serverClock - now;
  return {
    samples: [{ offset, receivedAt: now }],
    slewFrom: offset,
    slewStart: now,
    targetOffset: offset,
    behindSince: null,
  };
}

/**
 * Corrects the estimate with a clock value received from the server at local time `now`
 * Every sample arrives late by its network delay, so the one putting the clock furthest ahead is the most accurate
 */
export function updateClockEstimate(estimate: ClockEstimate | null, serverClock: number, now: number): ClockEstimate {
  if (!estimate) {
    return createClockEstimate(serverClock, now);
  }

  const appliedOffset = getAppliedOffset(estimate, now);
  const error = wrapDifference(serverClock - (now + appliedOffset));
  if (error > snapThresholdMs) {
    return createClockEstimate(serverClock, now);
  }

  // a sample far behind is usually a late packet, we only follow it if the server stays behind
  if (error < -snapThresholdMs) {
    const behindSince = estimate.behindSince ?? now;
    if (now - behindSince >= backwardSnapDelayMs) {
      return createClockEstimate(serverClock, now);
    }
    return { ...estimate, behindSince };
  }

  const samples = estimate.samples.filter((sample) => now - sample.receivedAt < sampleWindowMs);
  samples.push({ offset: appliedOffset + error, receivedAt: now });
  const targetOffset = Math.max(...samples.map((sample) => sample.offset));

  return { samples, slewFrom: appliedOffset, slewStart: now, targetOffset, behindSince: null };
}

/** Clock in ms since midnight at local time `now` */
export function getEstimatedClock(estimate: ClockEstimate, now: number): number {
  const clock = Math.floor(now + getAppliedOffset(estimate, now));
  return ((clock % dayInMs) + dayInMs) % dayInMs;
}

/**
 * Time until the estimated clock reaches its next whole second
 * While correcting drift the clock runs faster or slower, until the correction finishes
 */
export function getNextTickDelay(estimate: ClockEstimate, now: number): number {
  const toNextSecond = MILLIS_PER_SECOND - (getEstimatedClock(estimate, now) % MILLIS_PER_SECOND);
  const remainingCorrection = estimate.targetOffset - getAppliedOffset(estimate, now);
  if (remainingCorrection === 0) {
    return toNextSecond + tickMarginMs;
  }

  const speed = 1 + Math.sign(remainingCorrection) * slewRate;
  const correctionTime = Math.abs(remainingCorrection) / slewRate;
  if (toNextSecond <= correctionTime * speed) {
    return Math.ceil(toNextSecond / speed) + tickMarginMs;
  }
  return Math.ceil(correctionTime + toNextSecond - correctionTime * speed) + tickMarginMs;
}
