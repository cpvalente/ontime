import { useEffect } from 'react';

import { getServerClock } from '../../common/api/teleprompter';

const resyncInterval = 5 * 60 * 1000;

let offset = 0;

/** Now, on the server clock, which the teleprompter transport is timed against */
export function serverNow(): number {
  return Date.now() + offset;
}

/** Estimates the offset to the server clock from the fastest of a few round trips */
async function syncServerClock(samples = 3) {
  let fastest = Infinity;
  for (let i = 0; i < samples; i++) {
    const sentAt = Date.now();
    // oxlint-disable-next-line no-await-in-loop - round trips are timed one at a time
    const serverTime = await getServerClock();
    const receivedAt = Date.now();
    const roundTrip = receivedAt - sentAt;
    if (roundTrip < fastest) {
      fastest = roundTrip;
      offset = serverTime + roundTrip / 2 - receivedAt;
    }
  }
}

export function useServerClockSync() {
  // keeps this screen's clock in step with the server, so every screen shows the same line
  useEffect(() => {
    const sync = () => {
      void syncServerClock().catch(() => {});
    };
    sync();
    const interval = setInterval(sync, resyncInterval);
    return () => clearInterval(interval);
  }, []);
}
