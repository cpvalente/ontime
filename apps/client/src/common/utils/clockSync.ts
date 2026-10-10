import type { MessageTag, WsPacketToClient } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

/**
 * Client clock synchronisation
 * - Ping/Pong samples map the client's monotonic clock to the server's time of day (the offset)
 * - the least delayed of the latest samples is the estimate, a clock jump starts a new set
 * - the shown clock never moves backwards, so a correction never makes it visibly jump
 */

export const clockSampleCount = 5;
const clockJumpToleranceMs = 1000;

export type ClockSample = { offset: number; roundTrip: number };
export type PendingPing = { payload: Date; sentAt: number };

/** Measures a Pong matching the pending Ping: the latency and the updated offset estimate. */
export function measurePong(
  pong: Extract<WsPacketToClient, { tag: MessageTag.Pong }>,
  pendingPing: PendingPing | null,
  samples: readonly ClockSample[],
  receivedAt: number,
) {
  if (!pendingPing || new Date(pong.payload).getTime() !== pendingPing.payload.getTime()) {
    return null;
  }
  // The reply comes off the network: without a valid server clock it is not a sample.
  if (!Number.isFinite(pong.clock)) {
    return null;
  }

  // A zero-delay reply still means online: non-positive ping values are status sentinels.
  const ping = Math.max(1, (receivedAt - pendingPing.sentAt) / 2);
  return { ping, ...sampleClockOffset(samples, pong.clock, pendingPing.sentAt, receivedAt) };
}

/** Maps the client's monotonic clock to server time, assuming symmetric network delay. */
function getClockOffset(serverClock: number, sentAt: number, receivedAt: number): number {
  return serverClock - (sentAt + receivedAt) / 2;
}

/** Prefer the least delayed of the latest samples, so congestion does not steer the clock. */
export function sampleClockOffset(
  previous: readonly ClockSample[],
  serverClock: number,
  sentAt: number,
  receivedAt: number,
) {
  const sample = { offset: getClockOffset(serverClock, sentAt, receivedAt), roundTrip: receivedAt - sentAt };
  const previousBest = previous.length ? leastDelayedSample(previous) : sample;
  // Either measurement may be wrong by up to half its round trip when delay is asymmetric.
  const uncertainty = (sample.roundTrip + previousBest.roundTrip) / 2;
  const samples = hasClockJumped(sample.offset, previousBest.offset, uncertainty)
    ? [sample]
    : [...previous.slice(-(clockSampleCount - 1)), sample];
  return { samples, offset: leastDelayedSample(samples).offset };
}

/**
 * The server second to show, and how long until the measured clock reaches the next one.
 * Never shows an earlier second: a correction backwards holds the shown second until the measured clock catches up,
 * while a clock jump shows at once.
 */
export function getDisplayedClock(offset: number, now: number, shown: number | null) {
  const measured = toTimeOfDay(now + offset);
  const second = measured - (measured % 1000);
  const behind = shown === null ? 0 : getClockDifference(shown, second);
  const clock = shown !== null && behind > 0 && behind <= clockJumpToleranceMs ? shown : second;
  return { clock, untilNextSecond: Math.ceil(1000 - (measured % 1000)) };
}

/** Whether two times of day disagree by more than the jump tolerance plus the measurement uncertainty. */
function hasClockJumped(a: number, b: number, uncertainty: number): boolean {
  return Math.abs(getClockDifference(a, b)) > clockJumpToleranceMs + uncertainty;
}

function leastDelayedSample(samples: readonly ClockSample[]): ClockSample {
  return samples.reduce((best, current) => (current.roundTrip <= best.roundTrip ? current : best));
}

/**
 * Signed difference a - b between times of day, in the range (-12h, 12h].
 * Midnight changes a time of day by a whole day without changing the clock.
 */
function getClockDifference(a: number, b: number): number {
  const difference = toTimeOfDay(a - b);
  return difference > dayInMs / 2 ? difference - dayInMs : difference;
}

function toTimeOfDay(time: number): number {
  return ((time % dayInMs) + dayInMs) % dayInMs;
}
