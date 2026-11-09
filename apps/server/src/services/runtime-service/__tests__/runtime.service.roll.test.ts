import { join } from 'node:path';

import {
  EndAction,
  OntimeEntry,
  PlayableEvent,
  Playback,
  TimerLifeCycle,
  TimerPhase,
  runtimeStorePlaceholder,
} from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, createEvent } from 'ontime-utils';

import { addAutomation, addTrigger } from '../../../api-data/automation/automation.dao.js';
import * as httpClient from '../../../api-data/automation/clients/http.client.js';
import { makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import { rundownCache } from '../../../api-data/rundown/rundown.dao.js';
import { getFileToRead, initPersistence } from '../../../classes/data-provider/DataProvider.js';
import { makeNewProject } from '../../../models/dataModel.js';
import { timerConfig } from '../../../setup/config.js';
import { eventStore } from '../../../stores/EventStore.js';
import { clearState, getState } from '../../../stores/runtimeState.js';
import { restoreService } from '../../restore-service/restore.service.js';
import { runtimeService } from '../runtime.service.js';

const hour = MILLIS_PER_HOUR;
const minute = MILLIS_PER_MINUTE;
const midnight = new Date(2026, 0, 1).getTime();

function event(id: string, timeStart: number, timeEnd: number, patch?: Partial<PlayableEvent>): PlayableEvent {
  return createEvent({ id, timeStart, timeEnd, ...patch }) as PlayableEvent;
}

function prepare(entries: OntimeEntry[], clock: number) {
  vi.setSystemTime(midnight + clock);
  clearState();
  rundownCache.init(
    makeRundown({
      entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
      order: entries.map((e) => e.id),
    }),
    {},
  );
  runtimeService.init(null);
}

// Moving the wall clock alone does not run timers; advance one interval to deliver the update.
async function tickAt(clock: number) {
  vi.setSystemTime(midnight + clock - timerConfig.updateRate);
  vi.advanceTimersByTime(timerConfig.updateRate);
  await flushLifecycle();
}

function flushLifecycle() {
  return new Promise<void>((resolve) => process.nextTick(resolve));
}

function lifecycleOutputs() {
  return vi.mocked(httpClient.emitHTTP).mock.calls.map(([output, store]) => ({
    cycle: output.url,
    eventId: store.eventNow?.id,
  }));
}

beforeEach(async () => {
  const project = makeNewProject();
  for (const cycle of [TimerLifeCycle.onLoad, TimerLifeCycle.onStart, TimerLifeCycle.onFinish]) {
    project.automation.automations[cycle] = {
      id: cycle,
      title: cycle,
      filters: [],
      filterRule: 'all',
      outputs: [{ type: 'http', url: cycle }],
    };
    project.automation.triggers.push({ id: cycle, title: cycle, trigger: cycle, automationId: cycle });
  }
  await initPersistence(join(process.env.ONTIME_DATA!, 'roll.json'), project);
  vi.useFakeTimers();
  vi.spyOn(httpClient, 'emitHTTP').mockImplementation(() => {});
  vi.spyOn(restoreService, 'save').mockResolvedValue();
  eventStore.init(structuredClone(runtimeStorePlaceholder));
  runtimeService.stop();
  await flushLifecycle();
});

afterEach(async () => {
  runtimeService.shutdown();
  await flushLifecycle();
  clearState();
  await getFileToRead();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('roll lifecycle', () => {
  test('joining an event sends load then start once, and ordinary ticks do not repeat them', async () => {
    prepare([event('now', hour, 2 * hour)], hour + 5 * minute);

    runtimeService.roll();
    await flushLifecycle();
    await tickAt(hour + 5 * minute + timerConfig.updateRate);

    expect(lifecycleOutputs()).toEqual([
      { cycle: TimerLifeCycle.onLoad, eventId: 'now' },
      { cycle: TimerLifeCycle.onStart, eventId: 'now' },
    ]);
  });

  test('pre-roll sends load immediately and start only when the countdown finishes', async () => {
    prepare([event('next', hour, 2 * hour)], hour - 100);

    runtimeService.roll();
    await flushLifecycle();
    expect(lifecycleOutputs()).toEqual([{ cycle: TimerLifeCycle.onLoad, eventId: 'next' }]);

    await tickAt(hour);
    expect(lifecycleOutputs()).toEqual([
      { cycle: TimerLifeCycle.onLoad, eventId: 'next' },
      { cycle: TimerLifeCycle.onStart, eventId: 'next' },
    ]);
    expect(getState().timer).toMatchObject({ playback: Playback.Roll, secondaryTimer: null });
  });

  test('taking over manual playback preserves its timing without repeating load or start automations', async () => {
    prepare([event('now', hour, 2 * hour)], hour + 5 * minute);
    runtimeService.startById('now');
    runtimeService.addTime(2 * minute);
    await flushLifecycle();
    vi.mocked(httpClient.emitHTTP).mockClear();

    runtimeService.roll();
    await tickAt(hour + 6 * minute);

    expect(lifecycleOutputs()).toEqual([]);
    expect(getState()).toMatchObject({
      timer: {
        playback: Playback.Roll,
        startedAt: hour + 5 * minute,
        addedTime: 2 * minute,
        current: 61 * minute,
        elapsed: minute,
      },
      offset: { absolute: 7 * minute },
    });
  });

  test('roll ignores end actions and waits through a gap before starting the next event', async () => {
    prepare(
      [event('now', hour, 2 * hour, { endAction: EndAction.PlayNext }), event('next', 2 * hour + minute, 3 * hour)],
      2 * hour - 100,
    );
    runtimeService.roll();
    await flushLifecycle();
    vi.mocked(httpClient.emitHTTP).mockClear();

    await tickAt(2 * hour);
    expect(getState()).toMatchObject({
      eventNow: { id: 'next' },
      timer: { playback: Playback.Roll, phase: TimerPhase.Pending, secondaryTimer: minute },
    });
    expect(lifecycleOutputs().map(({ cycle }) => cycle)).toEqual([TimerLifeCycle.onFinish, TimerLifeCycle.onLoad]);

    await tickAt(2 * hour + minute);
    expect(lifecycleOutputs().map(({ cycle }) => cycle)).toEqual([
      TimerLifeCycle.onFinish,
      TimerLifeCycle.onLoad,
      TimerLifeCycle.onStart,
    ]);
  });

  test.each([
    { scenario: 'a cue marked as skipped', omitted: { ...event('skipped', 2 * hour, 3 * hour), skip: true } },
    { scenario: 'a zero-duration placeholder (edge case)', omitted: event('zero', 2 * hour, 2 * hour) },
  ])('advancing past $scenario loads and starts the next timed cue', async ({ omitted }) => {
    prepare([event('now', hour, 2 * hour), omitted, event('next', 2 * hour, 3 * hour)], 2 * hour - 100);
    runtimeService.roll();
    await flushLifecycle();
    vi.mocked(httpClient.emitHTTP).mockClear();

    await tickAt(2 * hour);

    expect(getState().eventNow?.id).toBe('next');
    expect(lifecycleOutputs().filter(({ cycle }) => cycle !== TimerLifeCycle.onFinish)).toEqual([
      { cycle: TimerLifeCycle.onLoad, eventId: 'next' },
      { cycle: TimerLifeCycle.onStart, eventId: 'next' },
    ]);
  });
});

describe('roll timer phases', () => {
  test('warning and danger automations are sent once as the timer reaches them', async () => {
    for (const cycle of [TimerLifeCycle.onWarning, TimerLifeCycle.onDanger]) {
      const automation = await addAutomation({
        title: cycle,
        filters: [],
        filterRule: 'all',
        outputs: [{ type: 'http', url: cycle }],
      });
      await addTrigger({ title: cycle, trigger: cycle, automationId: automation.id });
    }
    prepare([event('now', hour, 2 * hour, { timeWarning: 10 * minute, timeDanger: 5 * minute })], hour + 40 * minute);
    runtimeService.roll();
    await flushLifecycle();

    await tickAt(hour + 50 * minute);
    await tickAt(hour + 51 * minute);
    await tickAt(hour + 55 * minute);
    await tickAt(hour + 56 * minute);

    expect(
      lifecycleOutputs().filter(({ cycle }) => cycle === TimerLifeCycle.onWarning || cycle === TimerLifeCycle.onDanger),
    ).toEqual([
      { cycle: TimerLifeCycle.onWarning, eventId: 'now' },
      { cycle: TimerLifeCycle.onDanger, eventId: 'now' },
    ]);
  });
});

// Characterizations of current behaviour: either jump finishes the running event before the time skip check runs.
describe('roll after the clock jumps', () => {
  test('a clock moved back is read as midnight passing: the event finishes and roll waits for the next day', async () => {
    prepare([event('now', hour, 2 * hour)], hour + 5 * minute);
    runtimeService.roll();
    await flushLifecycle();
    vi.mocked(httpClient.emitHTTP).mockClear();

    await tickAt(30 * minute);

    expect(lifecycleOutputs().map(({ cycle }) => cycle)).toEqual([TimerLifeCycle.onFinish, TimerLifeCycle.onLoad]);
    expect(getState()).toMatchObject({
      eventNow: { id: 'now' },
      timer: { playback: Playback.Roll, phase: TimerPhase.Pending, secondaryTimer: 23 * hour },
    });
  });

  test('a clock moved past the end counts the skipped time as delay: the running event waits', async () => {
    prepare([event('first', hour, 2 * hour), event('later', 3 * hour, 4 * hour)], hour + 5 * minute);
    runtimeService.roll();
    await flushLifecycle();
    vi.mocked(httpClient.emitHTTP).mockClear();

    await tickAt(3 * hour + 30 * minute);

    expect(lifecycleOutputs().map(({ cycle }) => cycle)).toEqual([TimerLifeCycle.onFinish, TimerLifeCycle.onLoad]);
    expect(getState()).toMatchObject({
      eventNow: { id: 'later' },
      timer: { playback: Playback.Roll, phase: TimerPhase.Pending, secondaryTimer: hour },
      offset: { absolute: 90 * minute },
    });
  });
});

// `.fails` keeps known bugs executable; remove it with the corresponding fix.
describe('roll automation bugs', () => {
  test.fails('finish automations receive the event that finished when rolling into the next event', async () => {
    prepare([event('first', hour, 2 * hour), event('next', 2 * hour, 3 * hour)], 2 * hour - 100);
    runtimeService.roll();
    await flushLifecycle();
    vi.mocked(httpClient.emitHTTP).mockClear();

    await tickAt(2 * hour);

    expect(lifecycleOutputs()).toEqual([
      { cycle: TimerLifeCycle.onFinish, eventId: 'first' },
      { cycle: TimerLifeCycle.onLoad, eventId: 'next' },
      { cycle: TimerLifeCycle.onStart, eventId: 'next' },
    ]);
  });

  test.fails("a cue's own finish automation is sent when roll advances to the next cue", async () => {
    const automation = await addAutomation({
      title: 'Event finish',
      filters: [],
      filterRule: 'all',
      outputs: [{ type: 'http', url: 'event-finish' }],
    });
    const first = event('first', hour, 2 * hour, {
      triggers: [
        { id: 'event-finish', title: 'Event finish', trigger: TimerLifeCycle.onFinish, automationId: automation.id },
      ],
    });
    prepare([first, event('next', 2 * hour, 3 * hour)], 2 * hour - 100);
    runtimeService.roll();
    await flushLifecycle();
    vi.mocked(httpClient.emitHTTP).mockClear();

    await tickAt(2 * hour);

    expect(lifecycleOutputs()).toContainEqual({ cycle: 'event-finish', eventId: 'first' });
  });
});

describe('roll at the end of the show (edge case for repeated rundowns)', () => {
  test.fails('finishing the last cue waits for tomorrow without emitting a new start automation', async () => {
    prepare([event('last', hour, 2 * hour)], 2 * hour - 100);
    runtimeService.roll();
    await flushLifecycle();
    vi.mocked(httpClient.emitHTTP).mockClear();

    await tickAt(2 * hour);

    expect(lifecycleOutputs()).toEqual([
      { cycle: TimerLifeCycle.onFinish, eventId: 'last' },
      { cycle: TimerLifeCycle.onLoad, eventId: 'last' },
    ]);
    expect(getState().timer).toMatchObject({ phase: TimerPhase.Pending, secondaryTimer: 23 * hour });
  });
});
