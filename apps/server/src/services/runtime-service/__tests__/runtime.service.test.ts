import { OffsetMode } from 'ontime-types';

import { makeOntimeEvent, makeOntimeGroup, makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import { getCurrentRundown } from '../../../api-data/rundown/rundown.dao.js';
import type { RundownMetadata } from '../../../api-data/rundown/rundown.types.js';
import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import type { RuntimeState } from '../../../stores/runtimeState.js';

/**
 * Captures what the runtime service pushes into the event store batch
 */
const store = vi.hoisted(() => ({
  batched: [] as Array<[string, unknown]>,
  sendCount: 0,
}));

/** Lets each test drive what the runtime state reports */
const stateRef = vi.hoisted(() => ({ current: null as unknown as RuntimeState }));

/** Lets each test drive what the rundown cache reports */
const rundownRef = vi.hoisted(() => ({ metadata: null as unknown as RundownMetadata }));

vi.mock('../../../stores/EventStore.js', () => ({
  eventStore: {
    createBatch: () => ({
      add: (key: string, value: unknown) => {
        store.batched.push([key, value]);
      },
      send: () => {
        store.sendCount += 1;
      },
    }),
    poll: vi.fn(() => ({})),
    get: vi.fn(),
    set: vi.fn(),
    init: vi.fn(),
    broadcast: vi.fn(),
  },
}));

vi.mock('../../../stores/runtimeState.js', () => ({
  getState: () => stateRef.current,
  setOffsetMode: vi.fn(),
  stop: vi.fn(() => true),
  updateRundownData: vi.fn(),
  updateAll: vi.fn(),
  load: vi.fn(() => true),
  resume: vi.fn(),
  roll: vi.fn(() => ({ eventId: null, didStart: false })),
}));

vi.mock('../../../api-data/rundown/rundown.dao.js', () => ({
  getCurrentRundown: vi.fn(() => ({ id: 'rundown', title: '', order: [], flatOrder: [], entries: {}, revision: 0 })),
  getRundownMetadata: () => rundownRef.metadata,
  getEntryWithId: vi.fn(),
}));

// the timer owns a setInterval, we do not want it running in tests
vi.mock('../../EventTimer.js', () => ({
  EventTimer: class {
    setOnUpdateCallback() {}
    start() {
      return true;
    }
    pause() {
      return true;
    }
    stop() {
      return true;
    }
    addTime() {
      return true;
    }
    scheduleNextBoundary() {}
    shutdown() {}
  },
}));

vi.mock('../../restore-service/restore.service.js', () => ({
  restoreService: { save: vi.fn(() => Promise.resolve()), load: vi.fn(), clear: vi.fn() },
}));

vi.mock('../../../api-data/automation/automation.service.js', () => ({ triggerAutomations: vi.fn() }));
vi.mock('../../../api-data/report/report.service.js', () => ({ triggerReportEntry: vi.fn() }));
vi.mock('../../../classes/Logger.js', () => ({
  logger: { info: vi.fn(), warning: vi.fn(), error: vi.fn(), crash: vi.fn(), emit: vi.fn() },
}));

import * as runtimeState from '../../../stores/runtimeState.js';
import { runtimeService } from '../runtime.service.js';

function makeRundownMetadata(patch?: Partial<RundownMetadata>): RundownMetadata {
  return {
    totalDelay: 0,
    totalDuration: 0,
    totalDays: 0,
    firstStart: null,
    lastEnd: null,
    playableEventOrder: [],
    timedEventOrder: [],
    flatEntryOrder: [],
    flags: [],
    ...patch,
  };
}

/** applies a state and runs a decorated method, returning the keys which were broadcast */
function broadcastWith(state: RuntimeState): string[] {
  stateRef.current = state;
  store.batched = [];
  runtimeService.setOffsetMode(OffsetMode.Absolute);
  return store.batched.map(([key]) => key);
}

beforeEach(() => {
  vi.clearAllMocks();
  store.sendCount = 0;
});

/**
 * The service holds its last known state in a static which persists across tests,
 * each test uses its own entry IDs so that a change is unambiguous
 */
describe('broadcastResult()', () => {
  it('broadcasts every changed entry in a single batch', () => {
    const keys = broadcastWith(
      makeRuntimeStateData({
        eventNow: makeOntimeEvent({ id: 'all-now' }),
        eventNext: makeOntimeEvent({ id: 'all-next' }),
        eventFlag: makeOntimeEvent({ id: 'all-flag' }),
        groupNow: makeOntimeGroup({ id: 'all-group' }),
      }),
    );

    // all four changed against the previous state, all four must be published
    expect(keys).toContain('eventNow');
    expect(keys).toContain('eventNext');
    expect(keys).toContain('eventFlag');
    expect(keys).toContain('groupNow');
    // and they go out together
    expect(store.sendCount).toBe(1);
  });

  it('publishes a later entry change even when the loaded event changed first', () => {
    broadcastWith(makeRuntimeStateData({ eventNow: makeOntimeEvent({ id: 'seq-now' }) }));

    // moving to a new event also brings a new next event into scope:
    // the loaded event changing must not mask the entries checked after it
    const keys = broadcastWith(
      makeRuntimeStateData({
        eventNow: makeOntimeEvent({ id: 'seq-now-2' }),
        eventNext: makeOntimeEvent({ id: 'seq-next-2' }),
      }),
    );

    expect(keys).toContain('eventNow');
    expect(keys).toContain('eventNext');
  });

  it('does not re-broadcast entries which have not changed', () => {
    const state = makeRuntimeStateData({
      eventNow: makeOntimeEvent({ id: 'same-now' }),
      eventNext: makeOntimeEvent({ id: 'same-next' }),
    });

    expect(broadcastWith(state)).toEqual(expect.arrayContaining(['eventNow', 'eventNext']));

    // a second pass over an unchanged state should not publish the entries again
    const keys = broadcastWith(state);
    expect(keys).not.toContain('eventNow');
    expect(keys).not.toContain('eventNext');
  });
});

describe('notifyOfChangedEvents()', () => {
  it('hot-reloads the loaded event with the rundown data read at call time', () => {
    stateRef.current = makeRuntimeStateData({ eventNow: makeOntimeEvent({ id: 'live-now' }) });
    const liveMetadata = makeRundownMetadata({ playableEventOrder: ['live'] });
    rundownRef.metadata = liveMetadata;
    vi.mocked(getCurrentRundown).mockReturnValueOnce(
      makeRundown({ entries: { 'live-now': makeOntimeEvent({ id: 'live-now' }) } }),
    );
    const stop = vi.spyOn(runtimeService, 'stop');

    runtimeService.notifyOfChangedEvents();

    expect(runtimeState.updateRundownData).toHaveBeenCalledWith(liveMetadata);
    expect(runtimeState.updateAll).toHaveBeenCalledWith(expect.anything(), liveMetadata);
    expect(stop).not.toHaveBeenCalled();
  });

  it('stops playback instead of hot-reloading when the loaded event can no longer play', () => {
    stateRef.current = makeRuntimeStateData({ eventNow: makeOntimeEvent({ id: 'deleted-now' }) });
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: ['other'] });
    const stop = vi.spyOn(runtimeService, 'stop');

    runtimeService.notifyOfChangedEvents();

    expect(runtimeState.updateRundownData).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
    expect(runtimeState.updateAll).not.toHaveBeenCalled();
  });
});
