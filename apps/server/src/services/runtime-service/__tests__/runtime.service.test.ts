import { EndAction, Instant, OffsetMode, Playback, RefetchKey } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { makeOntimeEvent, makeOntimeGroup, makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
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
  updateRundownData: vi.fn(),
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
vi.mock('../../../api-data/logs/logs.service.js', () => ({
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  crash: vi.fn(),
}));

import * as logger from '../../../api-data/logs/logs.service.js';
import { getCurrentRundown, getEntryWithId } from '../../../api-data/rundown/rundown.dao.js';
import * as runtimeState from '../../../stores/runtimeState.js';
import { notifyChange } from '../../change-service/change.service.js';
import { restoreService } from '../../restore-service/restore.service.js';
import type { RestorePoint } from '../../restore-service/restore.types.js';
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

describe('init()', () => {
  it('catches up with the rundown data and reconciles with changes to the loaded rundown only', () => {
    stateRef.current = makeRuntimeStateData();
    rundownRef.metadata = makeRundownMetadata({ timedEventOrder: ['a'] });

    runtimeService.init(null);
    expect(runtimeState.updateRundownData).toHaveBeenCalledWith(rundownRef.metadata);
    // catching up does not broadcast, so nothing is saved before a restore point is resumed
    expect(restoreService.save).not.toHaveBeenCalled();

    vi.mocked(runtimeState.updateRundownData).mockClear();
    notifyChange(RefetchKey.Rundown, 1, 'background');
    expect(runtimeState.updateRundownData).not.toHaveBeenCalled();

    notifyChange(RefetchKey.Rundown, 1, 'rundown');
    expect(runtimeState.updateRundownData).toHaveBeenCalledTimes(1);

    runtimeService.shutdown();
    notifyChange(RefetchKey.Rundown, 2, 'rundown');
    expect(runtimeState.updateRundownData).toHaveBeenCalledTimes(1);
  });
});

describe('notifyOfChangedEvents()', () => {
  it('updates the rundown data and leaves playback alone when no event is loaded', () => {
    stateRef.current = makeRuntimeStateData();
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: ['a'] });
    const stop = vi.spyOn(runtimeService, 'stop');

    runtimeService.notifyOfChangedEvents();

    expect(runtimeState.updateRundownData).toHaveBeenCalledWith(rundownRef.metadata);
    expect(runtimeState.updateAll).not.toHaveBeenCalled();
    expect(stop).not.toHaveBeenCalled();
  });

  it('stops playback and skips the update when the rundown has no playable events', () => {
    stateRef.current = makeRuntimeStateData({
      eventNow: makeOntimeEvent({ id: 'empty-now' }),
      timer: { playback: Playback.Play },
    });
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: [] });

    runtimeService.notifyOfChangedEvents();

    expect(runtimeState.stop).toHaveBeenCalled();
    // stopping clears the loaded data, there is nothing left to reconcile
    expect(runtimeState.updateAll).not.toHaveBeenCalled();
    // nothing on screen explains why playback stopped
    expect(logger.warning).toHaveBeenCalledWith('PLAYBACK', 'Playback stopped', { reason: 'no-playable-events' });
  });

  it('reconciles against the rundown data read at call time', () => {
    stateRef.current = makeRuntimeStateData({ eventNow: makeOntimeEvent({ id: 'live-now' }) });
    const liveMetadata = makeRundownMetadata({ playableEventOrder: ['live-now'] });
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

    expect(stop).toHaveBeenCalled();
    expect(runtimeState.updateAll).not.toHaveBeenCalled();
  });

  it('broadcasts the reconciled entries in the same call', () => {
    stateRef.current = makeRuntimeStateData({ eventNow: makeOntimeEvent({ id: 'reconcile-now', title: 'before' }) });
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: ['reconcile-now'] });
    // the previous state is only known after a broadcast
    broadcastWith(stateRef.current);
    store.batched = [];
    vi.mocked(getCurrentRundown).mockReturnValueOnce(
      makeRundown({ entries: { 'reconcile-now': makeOntimeEvent({ id: 'reconcile-now' }) } }),
    );
    vi.mocked(runtimeState.updateAll).mockImplementationOnce(() => {
      stateRef.current = { ...stateRef.current, eventNow: makeOntimeEvent({ id: 'reconcile-now', title: 'after' }) };
    });

    runtimeService.notifyOfChangedEvents();

    expect(store.batched).toContainEqual(['eventNow', expect.objectContaining({ title: 'after' })]);
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
    expect(logger.warning).toHaveBeenCalledWith('SERVER', 'Restore skipped', {
      reason: 'other-rundown',
      rundown: 'another-rundown',
    });
  });

  it('explains when the restored event no longer exists', () => {
    vi.mocked(getEntryWithId).mockReturnValue(undefined);

    runtimeService.resume(restorePoint);

    expect(runtimeState.resume).not.toHaveBeenCalled();
    expect(logger.warning).toHaveBeenCalledWith('SERVER', 'Restore skipped', {
      reason: 'event-not-playable',
      id: 'resume-event',
    });
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

describe('end actions', () => {
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
    const now = makeOntimeEvent({ id: 'playnext-now', cue: '12', endAction: EndAction.PlayNext });
    const next = makeOntimeEvent({ id: 'playnext-next' });
    stateRef.current = makeRuntimeStateData({ eventNow: now, timer: { playback: Playback.Play } });
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: [now.id, next.id] });
    vi.mocked(getEntryWithId).mockReturnValue(next);
    vi.mocked(runtimeState.load).mockImplementationOnce(() => {
      stateRef.current = makeRuntimeStateData({ eventNow: next, timer: { playback: Playback.Armed } });
      return true;
    });
  }

  it('loads the next event when the LoadNext end action fires', () => {
    const now = makeOntimeEvent({ id: 'loadnext-now', endAction: EndAction.LoadNext });
    const next = makeOntimeEvent({ id: 'loadnext-next' });
    rundownRef.metadata = makeRundownMetadata({ playableEventOrder: [now.id, next.id] });
    vi.mocked(getEntryWithId).mockReturnValue(next);
    stateRef.current = makeRuntimeStateData({ eventNow: now, timer: { playback: Playback.Play } });

    tick({ hasTimerFinished: true, finishedAt: 1010 as Instant, hasSecondaryTimerFinished: false });

    vi.advanceTimersByTime(0);

    expect(runtimeState.load).toHaveBeenCalledWith(next, expect.anything(), rundownRef.metadata);
    expect(runtimeState.start).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('PLAYBACK', 'End action triggered', {
      action: 'load-next',
      id: 'loadnext-now',
    });
  });

  it('starts the next event at the instant the previous one ended', () => {
    playingWithNext();

    // the end was detected 10ms ahead of the instant the timer reaches it
    tick({ hasTimerFinished: true, finishedAt: 1010 as Instant, hasSecondaryTimerFinished: false });

    vi.advanceTimersByTime(9);
    expect(runtimeState.start).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(runtimeState.start).toHaveBeenCalledWith(undefined, 1010);
    expect(logger.info).toHaveBeenCalledWith('PLAYBACK', 'End action triggered', { action: 'play-next', cue: '12' });
  });

  it('starts the next event now when the previous one ended long ago, as after the system slept', () => {
    playingWithNext();
    vi.setSystemTime(1000 + MILLIS_PER_HOUR);

    tick({ hasTimerFinished: true, finishedAt: 1000 as Instant, hasSecondaryTimerFinished: false });
    vi.advanceTimersByTime(0);

    expect(runtimeState.start).toHaveBeenCalledWith(undefined, 1000 + MILLIS_PER_HOUR);
    expect(logger.info).toHaveBeenCalledWith('PLAYBACK', 'End action triggered', {
      action: 'play-next',
      cue: '12',
      late: true,
    });
  });

  it('does not start the next event if playback stopped before the previous one ended', () => {
    const now = makeOntimeEvent({ id: 'playnext-now', endAction: EndAction.PlayNext });
    stateRef.current = makeRuntimeStateData({ eventNow: now, timer: { playback: Playback.Play } });

    tick({ hasTimerFinished: true, finishedAt: 1010 as Instant, hasSecondaryTimerFinished: false });
    stateRef.current = makeRuntimeStateData({ eventNow: null, timer: { playback: Playback.Stop } });

    vi.advanceTimersByTime(10);
    expect(runtimeState.load).not.toHaveBeenCalled();
    expect(runtimeState.start).not.toHaveBeenCalled();
    // the operator stopped playback, there is no side effect to explain
    expect(logger.info).not.toHaveBeenCalledWith('PLAYBACK', 'End action triggered', expect.anything());
  });
});
