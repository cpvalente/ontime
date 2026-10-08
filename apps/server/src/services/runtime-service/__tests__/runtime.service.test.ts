import { EndAction, Instant, OffsetMode, Playback } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { makeOntimeEvent, makeOntimeGroup } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import type { RundownMetadata } from '../../../api-data/rundown/rundown.types.js';
import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import type { RuntimeState, UpdateResult } from '../../../stores/runtimeState.js';

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
  updateAll: vi.fn(),
  load: vi.fn(() => true),
  resume: vi.fn(),
  roll: vi.fn(() => ({ eventId: null, didStart: false })),
  start: vi.fn((_state?: RuntimeState, _at?: Instant) => true),
  update: vi.fn((): UpdateResult => ({ hasTimerFinished: false, finishedAt: null, hasSecondaryTimerFinished: false })),
  getTimeToNextBoundary: vi.fn(() => null),
}));

vi.mock('../../../api-data/rundown/rundown.dao.js', () => ({
  getCurrentRundown: vi.fn(() => ({ id: 'rundown', title: '', order: [], flatOrder: [], entries: {}, revision: 0 })),
  getCurrentRundownId: vi.fn(() => 'rundown'),
  getRundownMetadata: () => rundownRef.metadata,
  getEntryWithId: vi.fn(),
}));

/** Lets each test drive the timer ticks */
const timerRef = vi.hoisted(() => ({
  onTick: undefined as ((at: Instant) => void) | undefined,
}));

// the timer owns a setInterval, we do not want it running in tests
vi.mock('../tickingTimer.js', () => ({
  createTickingTimer: ({ onTick }: { onTick: (at: Instant) => void }) => {
    timerRef.onTick = onTick;
    return { start() {}, stop() {}, scheduleBoundary() {} };
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

import { getEntryWithId } from '../../../api-data/rundown/rundown.dao.js';
import * as runtimeState from '../../../stores/runtimeState.js';
import { restoreService } from '../../restore-service/restore.service.js';
import type { RestorePoint } from '../../restore-service/restore.type.js';
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
  it('saves playback with its rundown and offset mode', () => {
    broadcastWith(
      makeRuntimeStateData({
        eventNow: makeOntimeEvent({ id: 'saved-event' }),
        offset: { mode: OffsetMode.Relative },
      }),
    );

    expect(restoreService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        rundownId: 'rundown',
        selectedEventId: 'saved-event',
        offsetMode: OffsetMode.Relative,
      }),
    );
  });

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
  it('does nothing when no event is loaded', () => {
    stateRef.current = makeRuntimeStateData();
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: ['a'] });

    runtimeService.notifyOfChangedEvents();

    expect(runtimeState.updateAll).not.toHaveBeenCalled();
    expect(runtimeState.stop).not.toHaveBeenCalled();
  });

  it('stops playback and skips the update when the rundown has no playable events', () => {
    stateRef.current = makeRuntimeStateData({ eventNow: makeOntimeEvent({ id: 'empty-now' }) });
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: [] });

    runtimeService.notifyOfChangedEvents();

    expect(runtimeState.stop).toHaveBeenCalled();
    // stopping clears the loaded data, there is nothing left to reconcile
    expect(runtimeState.updateAll).not.toHaveBeenCalled();
  });

  it('reconciles against the rundown data read at call time', () => {
    stateRef.current = makeRuntimeStateData({ eventNow: makeOntimeEvent({ id: 'live-now' }) });
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: ['stale'] });

    // the side effects are deferred, a later commit may have superseded the metadata
    // captured at commit time, so the runtime must read the current one
    const liveMetadata = makeRundownMetadata({ playableEventOrder: ['live'] });
    rundownRef.metadata = liveMetadata;

    runtimeService.notifyOfChangedEvents();

    expect(runtimeState.updateAll).toHaveBeenCalledWith(expect.anything(), liveMetadata);
  });
});

describe('resume()', () => {
  const restorePoint: RestorePoint = {
    rundownId: 'rundown',
    playback: Playback.Play,
    selectedEventId: 'resume-event',
    startedAt: 0,
    addedTime: 0,
    pausedAt: null,
    firstStart: 0,
    startEpoch: null,
    currentDay: 0,
    offsetMode: OffsetMode.Relative,
    savedAt: 0 as Instant,
  };

  beforeEach(() => {
    stateRef.current = makeRuntimeStateData();
    vi.mocked(getEntryWithId).mockReturnValue(makeOntimeEvent({ id: 'resume-event' }));
  });

  it('ignores a restore point saved from another rundown', () => {
    runtimeService.resume({ ...restorePoint, rundownId: 'another-rundown' });

    expect(runtimeState.setOffsetMode).not.toHaveBeenCalled();
    expect(runtimeState.resume).not.toHaveBeenCalled();
  });

  it('restores the offset mode and playback of the loaded rundown', () => {
    runtimeService.resume(restorePoint);

    expect(runtimeState.setOffsetMode).toHaveBeenCalledWith(OffsetMode.Relative);
    expect(runtimeState.resume).toHaveBeenCalledWith(
      restorePoint,
      expect.objectContaining({ id: 'resume-event' }),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe('PlayNext end action', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    runtimeService.init(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** ticks the timer, with the runtime reporting the given update */
  function tick(result: UpdateResult) {
    vi.mocked(runtimeState.update).mockReturnValueOnce(result);
    timerRef.onTick?.(Date.now() as Instant);
    expect(runtimeState.update).toHaveBeenCalledWith(Date.now());
  }

  /** plays an event with PlayNext, followed by an event the runtime can load */
  function playingWithNext() {
    const now = makeOntimeEvent({ id: 'playnext-now', endAction: EndAction.PlayNext });
    const next = makeOntimeEvent({ id: 'playnext-next' });
    stateRef.current = makeRuntimeStateData({ eventNow: now, timer: { playback: Playback.Play } });
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: [now.id, next.id] });
    vi.mocked(getEntryWithId).mockReturnValue(next);
    vi.mocked(runtimeState.load).mockImplementationOnce(() => {
      stateRef.current = makeRuntimeStateData({ eventNow: next, timer: { playback: Playback.Armed } });
      return true;
    });
  }

  it('starts the next event at the instant the previous one ended', () => {
    playingWithNext();

    // the end was detected 10ms ahead of the instant the timer reaches it
    tick({ hasTimerFinished: true, finishedAt: 1010 as Instant, hasSecondaryTimerFinished: false });

    vi.advanceTimersByTime(9);
    expect(runtimeState.start).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(runtimeState.start).toHaveBeenCalledWith(undefined, 1010);
  });

  it('starts the next event now when the previous one ended long ago, as after the system slept', () => {
    playingWithNext();
    vi.setSystemTime(1000 + MILLIS_PER_HOUR);

    tick({ hasTimerFinished: true, finishedAt: 1000 as Instant, hasSecondaryTimerFinished: false });
    vi.advanceTimersByTime(0);

    expect(runtimeState.start).toHaveBeenCalledWith(undefined, 1000 + MILLIS_PER_HOUR);
  });

  it('does not start the next event if playback stopped before the previous one ended', () => {
    const now = makeOntimeEvent({ id: 'playnext-now', endAction: EndAction.PlayNext });
    stateRef.current = makeRuntimeStateData({ eventNow: now, timer: { playback: Playback.Play } });

    tick({ hasTimerFinished: true, finishedAt: 1010 as Instant, hasSecondaryTimerFinished: false });
    stateRef.current = makeRuntimeStateData({ eventNow: null, timer: { playback: Playback.Stop } });

    vi.advanceTimersByTime(10);
    expect(runtimeState.load).not.toHaveBeenCalled();
    expect(runtimeState.start).not.toHaveBeenCalled();
  });
});
