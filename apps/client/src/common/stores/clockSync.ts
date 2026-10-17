import type { PongPayload } from 'ontime-types';
import { dayInMs, MILLIS_PER_SECOND } from 'ontime-utils';
import { create } from 'zustand';

/** Round trips measured in a sync, we keep the fastest since its delays are the most even */
const syncRoundTrips = 5;
/** A server clock further than this from ours is a change in the server time, not drift */
const resyncThresholdMs = 3 * MILLIS_PER_SECOND;

interface ClockSyncStore {
  /** server time of day minus local monotonic time (performance.now()), null until synced */
  offset: number | null;
}

export const useClockSyncStore = create<ClockSyncStore>(() => ({ offset: null }));

let pendingSentAt: number | null = null;
let roundTripsLeft = 0;
let fastest: { offset: number; roundTrip: number } | null = null;

/**
 * Starts measuring the offset to the server clock, keeping the current one until done
 * @returns payload of the first request
 */
export function startClockSync(now: number): number {
  roundTripsLeft = syncRoundTrips;
  fastest = null;
  pendingSentAt = now;
  return now;
}

/**
 * Records the reply to a sync request
 * @returns payload of the next request, or null when the sync is done
 */
export function handleClockSyncReply({ sentAt, clock }: PongPayload, now: number): number | null {
  // replies to other pings or to an abandoned sync are ignored
  if (sentAt !== pendingSentAt) {
    return null;
  }

  const roundTrip = now - sentAt;
  if (!fastest || roundTrip < fastest.roundTrip) {
    // the server read its clock about halfway through the round trip
    fastest = { offset: clock + roundTrip / 2 - now, roundTrip };
  }

  roundTripsLeft -= 1;
  if (roundTripsLeft > 0) {
    pendingSentAt = now;
    return now;
  }

  pendingSentAt = null;
  useClockSyncStore.setState({ offset: fastest.offset });
  return null;
}

/** Clock in ms since midnight at local time `now` */
export function getSyncedClock(offset: number, now: number): number {
  const clock = Math.floor(now + offset);
  return ((clock % dayInMs) + dayInMs) % dayInMs;
}

/**
 * Compares a clock value from the server with ours, discarding our offset if they are far apart
 * @returns whether we need to sync again
 */
export function checkServerClock(serverClock: number, now: number): boolean {
  const { offset } = useClockSyncStore.getState();
  if (offset === null) {
    return false;
  }

  // the difference takes the shortest way around midnight
  const difference = (((serverClock - getSyncedClock(offset, now)) % dayInMs) + dayInMs) % dayInMs;
  if (Math.min(difference, dayInMs - difference) <= resyncThresholdMs) {
    return false;
  }

  useClockSyncStore.setState({ offset: null });
  return true;
}
