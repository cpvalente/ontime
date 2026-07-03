import { MessageTag, OffsetMode, TimerLifeCycle } from 'ontime-types';
/**
 * Characterisation tests for the broadcast contract of the RuntimeService
 *
 * These tests lock down WHICH top-level keys of the runtime store are
 * emitted to clients for each action and tick. This is the wire contract
 * consumed by the client (which shallow-merges top-level keys) and by
 * user-facing automation templates.
 *
 * The tests drive the real production path: fake timers fire the
 * EventTimer interval, which runs update() and the broadcastResult
 * decorator diffing, down to the (spied) websocket fan-out.
 */
import type { MockInstance } from 'vitest';

import { makeFlatRundown } from '../../../stores/__tests__/harness/scenario.fixtures.js';

vi.mock('../../../classes/data-provider/DataProvider.js', () => {
  return {
    getDataProvider: vi.fn().mockImplementation(() => {
      return {
        setCustomFields: vi.fn().mockImplementation((newData) => newData),
        setRundown: vi.fn().mockImplementation((newData) => newData),
      };
    }),
  };
});

vi.mock('../../restore-service/restore.service.js', () => {
  return {
    restoreService: {
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn(),
      clear: vi.fn(),
      create: vi.fn(),
      shutdown: vi.fn(),
    },
  };
});

vi.mock('../../../api-data/automation/automation.service.js', () => {
  return {
    triggerAutomations: vi.fn(),
    testOutput: vi.fn(),
    testConditions: vi.fn(),
  };
});

vi.mock('../../../api-data/report/report.service.js', () => {
  return {
    generate: vi.fn(),
    clear: vi.fn(),
    triggerReportEntry: vi.fn(),
  };
});

type RuntimeServiceModule = typeof import('../runtime.service.js');
type AutomationModule = typeof import('../../../api-data/automation/automation.service.js');
type RestoreModule = typeof import('../../restore-service/restore.service.js');

let runtimeService: RuntimeServiceModule['runtimeService'];
let triggerAutomations: AutomationModule['triggerAutomations'];
let restoreService: RestoreModule['restoreService'];
let sendSpy: MockInstance;

/** RuntimeData patches sent over the websocket since the last spy reset */
function runtimePatches(): Record<string, unknown>[] {
  return sendSpy.mock.calls
    .filter(([tag]) => tag === MessageTag.RuntimeData)
    .map(([, payload]) => payload as Record<string, unknown>);
}

/** the sorted top-level keys of every emitted patch */
function emittedKeys(): string[][] {
  return runtimePatches().map((patch) => Object.keys(patch).sort());
}

/** drains the process.nextTick queue where automation triggers are scheduled */
async function flushNextTicks() {
  await new Promise((resolve) => process.nextTick(resolve));
}

beforeEach(async () => {
  // the runtime service starts its EventTimer interval at import time:
  // reset modules and install fake timers BEFORE importing, so the
  // interval is fake and controlled by the test
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime('jan 5 09:59');

  const websocketModule = await import('../../../adapters/WebsocketAdapter.js');
  sendSpy = vi.spyOn(websocketModule.socket, 'sendAsJson');

  const automationModule = await import('../../../api-data/automation/automation.service.js');
  triggerAutomations = automationModule.triggerAutomations;

  const restoreModule = await import('../../restore-service/restore.service.js');
  restoreService = restoreModule.restoreService;

  const serviceModule = await import('../runtime.service.js');
  runtimeService = serviceModule.runtimeService;
  runtimeService.init(null);

  const { initRundown } = await import('../../../api-data/rundown/rundown.service.js');
  await initRundown(makeFlatRundown(), {});
  // flush the scheduled rundown side effects
  // (we cannot use runAllTimers here, the EventTimer interval never stops)
  vi.runOnlyPendingTimers();

  sendSpy.mockClear();
  vi.mocked(restoreService.save).mockClear();
});

afterEach(() => {
  runtimeService.shutdown();
  vi.useRealTimers();
  vi.clearAllMocks();
});

/**
 * !!! characterised bug: the decorator combines the entry diffing with
 * `entryChanged ||= updateMaybeEntryIfChanged(key)`. The logical-or
 * assignment short-circuits: once one entry has changed, the remaining
 * entries are neither diffed nor emitted in that broadcast. Changed
 * entries therefore drip out one per broadcast cycle
 * (load emits eventNow; eventNext rides along on the next broadcast,
 * eventFlag on the one after)
 */
describe('characterisation: broadcast contract', () => {
  test('loading an event emits eventNow, timer, clock and rundown', () => {
    runtimeService.loadById('flat1');

    // eventNext and eventFlag also changed, but are held back by the short-circuit
    expect(emittedKeys()).toStrictEqual([['clock', 'eventNow', 'rundown', 'timer']]);
    // an immediate change also saves a restore point
    expect(restoreService.save).toHaveBeenCalledTimes(1);
  });

  test('starting emits timer, clock, offset and rundown', () => {
    runtimeService.loadById('flat1');
    vi.setSystemTime('jan 5 10:00');
    sendSpy.mockClear();

    runtimeService.start();

    // offset is included because the expected times are computed on start
    // eventNext is the pending entry dripping out from the load
    expect(emittedKeys()).toStrictEqual([['clock', 'eventNext', 'offset', 'rundown', 'timer']]);
  });

  test('ticks within the same second only flush the pending entry', () => {
    runtimeService.loadById('flat1');
    vi.setSystemTime('jan 5 10:00');
    runtimeService.start();
    sendSpy.mockClear();

    // the EventTimer interval fires every 32ms: run 5 production ticks
    vi.advanceTimersByTime(5 * 32);

    // nothing tick-related is emitted within the same second: the only
    // patch is the eventFlag entry still dripping out from the load
    expect(emittedKeys()).toStrictEqual([['eventFlag']]);
  });

  test('a tick crossing the second boundary emits timer and clock together', () => {
    runtimeService.loadById('flat1');
    vi.setSystemTime('jan 5 10:00');
    runtimeService.start();
    sendSpy.mockClear();

    // 32 interval ticks: the seconds boundary is crossed at the 1024ms tick
    vi.advanceTimersByTime(1024);

    // first tick flushes the dripping eventFlag; the boundary tick emits
    // timer and clock; offset is not included since it did not change
    expect(emittedKeys()).toStrictEqual([['eventFlag'], ['clock', 'timer']]);
  });

  test('addTime emits timer, clock and offset immediately', () => {
    runtimeService.loadById('flat1');
    vi.setSystemTime('jan 5 10:00');
    runtimeService.start();
    sendSpy.mockClear();
    vi.mocked(restoreService.save).mockClear();

    runtimeService.addTime(60_000);

    expect(emittedKeys()).toStrictEqual([['clock', 'eventFlag', 'offset', 'timer']]);
    expect(restoreService.save).toHaveBeenCalledTimes(1);
  });

  test('setOffsetMode emits the offset mid-second', () => {
    runtimeService.loadById('flat1');
    vi.setSystemTime('jan 5 10:00');
    runtimeService.start();
    sendSpy.mockClear();
    vi.mocked(restoreService.save).mockClear();

    runtimeService.setOffsetMode(OffsetMode.Relative);

    expect(emittedKeys()).toStrictEqual([['eventFlag', 'offset']]);
    // the mode change counts as an immediate change and saves a restore point
    expect(restoreService.save).toHaveBeenCalledTimes(1);
  });

  test('pause emits timer and clock; stop emits the clearing state', () => {
    runtimeService.loadById('flat1');
    vi.setSystemTime('jan 5 10:00');
    runtimeService.start();
    sendSpy.mockClear();

    runtimeService.pause();
    expect(emittedKeys()).toStrictEqual([['clock', 'eventFlag', 'timer']]);

    sendSpy.mockClear();
    runtimeService.stop();
    // eventNow clears to null; the other cleared entries are again held
    // back by the entry short-circuit
    expect(emittedKeys()).toStrictEqual([['clock', 'eventNow', 'offset', 'rundown', 'timer']]);
  });

  test('integration automations are throttled to the seconds rollover', async () => {
    runtimeService.loadById('flat1');
    vi.setSystemTime('jan 5 10:00');
    runtimeService.start();
    await flushNextTicks();
    vi.mocked(triggerAutomations).mockClear();

    // the first tick initialises the integration trackers and fires both cycles
    vi.advanceTimersByTime(32);
    await flushNextTicks();
    expect(vi.mocked(triggerAutomations).mock.calls).toStrictEqual([
      [TimerLifeCycle.onUpdate],
      [TimerLifeCycle.onClock],
    ]);
    vi.mocked(triggerAutomations).mockClear();

    // ticks within the same second do not trigger integrations
    vi.advanceTimersByTime(5 * 32);
    await flushNextTicks();
    expect(triggerAutomations).not.toHaveBeenCalled();

    // crossing into the next second triggers onUpdate and onClock once
    vi.advanceTimersByTime(832);
    await flushNextTicks();
    expect(vi.mocked(triggerAutomations).mock.calls).toStrictEqual([
      [TimerLifeCycle.onUpdate],
      [TimerLifeCycle.onClock],
    ]);
  });
});
