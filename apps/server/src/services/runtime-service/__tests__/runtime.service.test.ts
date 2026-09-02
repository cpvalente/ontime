import { OffsetMode, Playback, SupportedEntry, runtimeStorePlaceholder } from 'ontime-types';

import type { RuntimeState } from '../../../stores/runtimeState.js';

/**
 * These tests characterise the behaviour of the `@broadcastResult` decorator applied
 * to the public methods of RuntimeService:
 * - which methods broadcast and which do not
 * - the decorator forwards the return value of the original method
 * - the contents of the batch sent to the event store for a given state change
 * - the side effect of saving a restore point
 *
 * The service is a module level singleton holding a static `previousState`,
 * so every test re-imports the module to get an isolated instance.
 */

const mocks = vi.hoisted(() => {
  const makeState = (): RuntimeState => ({
    clock: 0,
    groupNow: null,
    eventNow: null,
    eventNext: null,
    eventFlag: null,
    offset: { ...runtimeStorePlaceholder.offset },
    timer: { ...runtimeStorePlaceholder.timer },
    rundown: { ...runtimeStorePlaceholder.rundown },
    _timer: {
      forceFinish: null,
      pausedAt: null,
      pausedDuration: 0,
      secondaryTarget: null,
      hasFinished: false,
    },
    _rundown: { totalDelay: 0 },
    _group: null,
    _flag: null,
    _end: null,
    _startEpoch: null,
    _startDayOffset: null,
  });

  return {
    makeState,
    // assigned by loadService(), the placeholder import is not available at hoist time
    state: null as unknown as RuntimeState,
    /** every batch created by the decorator, in order */
    batches: [] as { patch: Record<string, unknown>; sent: boolean }[],
    timer: {
      start: vi.fn(() => true),
      pause: vi.fn(() => true),
      stop: vi.fn(() => true),
      addTime: vi.fn(() => true),
      shutdown: vi.fn(),
      setOnUpdateCallback: vi.fn(),
    },
    save: vi.fn(() => Promise.resolve()),
    setOffsetMode: vi.fn(),
  };
});

vi.mock('../../../stores/EventStore.js', () => ({
  eventStore: {
    createBatch() {
      const entry: { patch: Record<string, unknown>; sent: boolean } = { patch: {}, sent: false };
      mocks.batches.push(entry);
      return {
        add(key: string, value: unknown) {
          entry.patch[key] = value;
        },
        send() {
          // mirrors the empty patch guard in the real event store
          if (Object.keys(entry.patch).length > 0) entry.sent = true;
        },
      };
    },
  },
}));

vi.mock('../../../stores/runtimeState.js', () => ({
  getState: () => mocks.state,
  setOffsetMode: mocks.setOffsetMode,
  stop: vi.fn(() => true),
  roll: vi.fn(() => ({ didStart: false, eventId: null })),
  resume: vi.fn(),
  updateAll: vi.fn(),
  load: vi.fn(() => true),
}));

vi.mock('../../EventTimer.js', () => ({
  EventTimer: class {
    start = mocks.timer.start;
    pause = mocks.timer.pause;
    stop = mocks.timer.stop;
    addTime = mocks.timer.addTime;
    shutdown = mocks.timer.shutdown;
    setOnUpdateCallback = mocks.timer.setOnUpdateCallback;
  },
}));

vi.mock('../../restore-service/restore.service.js', () => ({
  restoreService: { save: mocks.save },
}));

vi.mock('../../../api-data/rundown/rundown.dao.js', () => ({
  getCurrentRundown: vi.fn(() => ({ entries: {}, order: [], flatOrder: [], id: 'rundown', title: '' })),
  getEntryWithId: vi.fn(() => undefined),
  getRundownMetadata: vi.fn(() => ({ timedEventOrder: [], playableEventOrder: [] })),
}));

vi.mock('../../../api-data/automation/automation.service.js', () => ({ triggerAutomations: vi.fn() }));
vi.mock('../../../api-data/report/report.service.js', () => ({ triggerReportEntry: vi.fn() }));
vi.mock('../../../classes/Logger.js', () => ({
  logger: { info: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

async function loadService() {
  vi.resetModules();
  mocks.state = mocks.makeState();
  mocks.batches.length = 0;
  vi.clearAllMocks();
  const { runtimeService } = await import('../runtime.service.js');
  return runtimeService;
}

/** the last batch that actually reached the socket */
function lastSentPatch() {
  return mocks.batches.filter((batch) => batch.sent).at(-1)?.patch;
}

describe('RuntimeService decorated methods', () => {
  describe('which methods broadcast', () => {
    it('creates a batch for every decorated call', async () => {
      const service = await loadService();

      service.start();
      expect(mocks.batches).toHaveLength(1);

      service.pause();
      expect(mocks.batches).toHaveLength(2);

      service.stop();
      expect(mocks.batches).toHaveLength(3);
    });

    it.each([
      ['startById', () => ['an-id']],
      ['startByIndex', () => [0]],
      ['startByCue', () => ['a-cue']],
      ['loadById', () => ['an-id']],
      ['loadByIndex', () => [0]],
      ['loadByCue', () => ['a-cue']],
      ['loadPrevious', () => []],
      ['loadNext', () => []],
      ['start', () => []],
      ['startPrevious', () => []],
      ['startNext', () => []],
      ['pause', () => []],
      ['stop', () => []],
      ['reload', () => []],
      ['roll', () => []],
      ['addTime', () => [1000]],
      ['setOffsetMode', () => [OffsetMode.Relative]],
    ] as const)('%s broadcasts', async (method, makeArgs) => {
      const service = await loadService();

      // @ts-expect-error -- arguments are provided per method by the table above
      service[method](...makeArgs());

      expect(mocks.batches).toHaveLength(1);
    });

    it.each([
      ['getRuntimeState', () => []],
      ['getLoadedEventId', () => []],
      ['shutdown', () => []],
    ] as const)('%s does not broadcast', async (method, makeArgs) => {
      const service = await loadService();

      // @ts-expect-error -- arguments are provided per method by the table above
      service[method](...makeArgs());

      expect(mocks.batches).toHaveLength(0);
    });
  });

  describe('return values are forwarded', () => {
    it('returns the result of the original method', async () => {
      const service = await loadService();

      // no event matches, the original method returns false
      expect(service.loadById('missing')).toBe(false);
      expect(service.startById('missing')).toBe(false);
      expect(service.loadNext()).toBe(false);
      expect(service.loadPrevious()).toBe(false);
    });

    it('returns undefined for methods that do not return', async () => {
      const service = await loadService();

      expect(service.setOffsetMode(OffsetMode.Relative)).toBeUndefined();
      expect(mocks.setOffsetMode).toHaveBeenCalledWith(OffsetMode.Relative);
    });

    it('forwards a truthy result', async () => {
      const service = await loadService();

      // playback needs to be armed or paused for a start to be accepted
      mocks.state.timer = { ...mocks.state.timer, playback: Playback.Armed };

      expect(service.start()).toBe(true);
      expect(mocks.timer.start).toHaveBeenCalledOnce();
    });
  });

  describe('batch contents', () => {
    it('forces a full update on the first call', async () => {
      const service = await loadService();

      service.setOffsetMode(OffsetMode.Relative);

      // there is no previous state, so everything is considered changed
      expect(Object.keys(lastSentPatch() ?? {}).sort()).toEqual(['clock', 'offset', 'rundown', 'timer']);
    });

    it('sends nothing when the state has not changed', async () => {
      const service = await loadService();

      service.setOffsetMode(OffsetMode.Relative);
      service.setOffsetMode(OffsetMode.Relative);

      expect(mocks.batches).toHaveLength(2);
      expect(mocks.batches[1].sent).toBe(false);
      expect(mocks.batches[1].patch).toEqual({});
    });

    it('sends the timer and clock when playback changes', async () => {
      const service = await loadService();

      service.setOffsetMode(OffsetMode.Relative);
      mocks.state.timer = { ...mocks.state.timer, playback: Playback.Play };

      service.setOffsetMode(OffsetMode.Relative);

      expect(Object.keys(lastSentPatch() ?? {}).sort()).toEqual(['clock', 'timer']);
    });

    it('sends the offset when the offset mode changes', async () => {
      const service = await loadService();

      service.setOffsetMode(OffsetMode.Absolute);
      mocks.state.offset = { ...mocks.state.offset, mode: OffsetMode.Relative };

      service.setOffsetMode(OffsetMode.Relative);

      expect(lastSentPatch()).toHaveProperty('offset');
      expect(lastSentPatch()?.offset).toMatchObject({ mode: OffsetMode.Relative });
    });

    it('sends the loaded entries when they change', async () => {
      const service = await loadService();

      service.setOffsetMode(OffsetMode.Relative);
      mocks.state.eventNow = { id: 'event-1', title: 'first', type: SupportedEntry.Event } as RuntimeState['eventNow'];

      service.setOffsetMode(OffsetMode.Relative);

      expect(lastSentPatch()).toHaveProperty('eventNow');
      expect(lastSentPatch()?.eventNow).toMatchObject({ id: 'event-1' });
    });

    it('sends the rundown when it changes', async () => {
      const service = await loadService();

      service.setOffsetMode(OffsetMode.Relative);
      mocks.state.rundown = { ...mocks.state.rundown, numEvents: 3 };

      service.setOffsetMode(OffsetMode.Relative);

      expect(lastSentPatch()).toHaveProperty('rundown');
      expect(lastSentPatch()?.rundown).toMatchObject({ numEvents: 3 });
    });

    it('sends the clock when a second rolls over', async () => {
      const service = await loadService();

      service.setOffsetMode(OffsetMode.Relative);
      mocks.state.clock = 2000;

      service.setOffsetMode(OffsetMode.Relative);

      expect(lastSentPatch()).toEqual({ clock: 2000 });
    });
  });

  describe('restore point side effect', () => {
    it('saves a restore point when there are immediate changes', async () => {
      const service = await loadService();

      // the first call is always treated as an immediate change
      service.setOffsetMode(OffsetMode.Relative);

      expect(mocks.save).toHaveBeenCalledOnce();
      expect(mocks.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playback: Playback.Stop,
          selectedEventId: null,
        }),
      );
    });

    it('does not save a restore point when nothing of note changed', async () => {
      const service = await loadService();

      service.setOffsetMode(OffsetMode.Relative);
      mocks.save.mockClear();

      // only the clock moved, which is not an immediate change
      mocks.state.clock = 2000;
      service.setOffsetMode(OffsetMode.Relative);

      expect(mocks.save).not.toHaveBeenCalled();
    });
  });
});
