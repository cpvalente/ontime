import { dayInMs } from 'ontime-utils';

import {
  checkServerClock,
  getSyncedClock,
  handleClockSyncReply,
  startClockSync,
  useClockSyncStore,
} from '../clockSync';

// local monotonic time is unrelated to the time of day
const localStart = 50_000;
const serverStart = 12 * 60 * 60 * 1000;

/** Runs a full sync where the server clock reads `serverClock(sentAt)` and each round trip takes the given time */
function sync(roundTrips: number[], serverClock: (sentAt: number) => number, start = localStart) {
  let request: number | null = startClockSync(start);
  for (const roundTrip of roundTrips) {
    expect(request).not.toBeNull();
    const sentAt = request!;
    request = handleClockSyncReply({ sentAt, clock: serverClock(sentAt + roundTrip / 2) }, sentAt + roundTrip);
  }
  return request;
}

/** Server clock running in step with local time */
const inStep = (local: number) => serverStart + local - localStart;

describe('clock sync', () => {
  beforeEach(() => {
    useClockSyncStore.setState({ offset: null });
  });

  it('measures the offset with a quick sequence of requests', () => {
    expect(sync([20, 20, 20, 20], inStep)).not.toBeNull();
    expect(useClockSyncStore.getState().offset).toBeNull();

    expect(sync([20, 20, 20, 20, 20], inStep)).toBeNull();
    const { offset } = useClockSyncStore.getState();
    expect(getSyncedClock(offset!, localStart + 2500)).toBe(serverStart + 2500);
  });

  it('keeps the measure from the fastest round trip', () => {
    // a slow round trip with uneven delays: the reply took 300ms of the 400ms
    let request: number | null = startClockSync(localStart);
    request = handleClockSyncReply({ sentAt: request, clock: inStep(request + 100) }, request + 400);
    for (let i = 0; i < 4; i++) {
      request = handleClockSyncReply({ sentAt: request!, clock: inStep(request! + 5) }, request! + 10);
    }

    expect(request).toBeNull();
    const { offset } = useClockSyncStore.getState();
    expect(getSyncedClock(offset!, localStart + 5000)).toBe(serverStart + 5000);
  });

  it('ignores replies to an abandoned sync', () => {
    const abandoned = startClockSync(localStart);
    startClockSync(localStart + 100);

    expect(handleClockSyncReply({ sentAt: abandoned, clock: 0 }, localStart + 120)).toBeNull();
    expect(useClockSyncStore.getState().offset).toBeNull();
  });

  it('keeps the current offset while syncing again', () => {
    sync([10, 10, 10, 10, 10], inStep);
    const { offset } = useClockSyncStore.getState();

    startClockSync(localStart + 10_000);
    expect(useClockSyncStore.getState().offset).toBe(offset);
  });

  it('wraps the clock at midnight', () => {
    sync([10, 10, 10, 10, 10], (local) => dayInMs - 500 + local - localStart);
    const { offset } = useClockSyncStore.getState();

    expect(getSyncedClock(offset!, localStart + 800)).toBe(300);
  });
});

describe('checkServerClock', () => {
  beforeEach(() => {
    useClockSyncStore.setState({ offset: null });
    sync([10, 10, 10, 10, 10], inStep);
  });

  it('keeps the offset for small differences, like a late packet', () => {
    expect(checkServerClock(serverStart + 7000, localStart + 10_000)).toBe(false);
    expect(useClockSyncStore.getState().offset).not.toBeNull();
  });

  it.each([
    { name: 'forwards', serverClock: serverStart + 60 * 60 * 1000 },
    { name: 'backwards', serverClock: serverStart - 60 * 60 * 1000 },
  ])('discards the offset when the server time changes $name', ({ serverClock }) => {
    expect(checkServerClock(serverClock, localStart)).toBe(true);
    expect(useClockSyncStore.getState().offset).toBeNull();

    // we wait for the new sync instead of restarting it on every value
    expect(checkServerClock(serverClock + 1000, localStart + 1000)).toBe(false);
  });

  it('compares across midnight', () => {
    useClockSyncStore.setState({ offset: null });
    sync([10, 10, 10, 10, 10], (local) => dayInMs - 500 + local - localStart);

    // our clock reads 300ms past midnight
    expect(checkServerClock(dayInMs - 1000, localStart + 800)).toBe(false);
  });
});
