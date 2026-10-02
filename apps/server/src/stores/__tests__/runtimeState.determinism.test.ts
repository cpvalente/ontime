import { Instant, PlayableEvent } from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { makeOntimeEvent, makeRundown } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { rundownCache } from '../../api-data/rundown/rundown.dao.js';
import { initRundown } from '../../api-data/rundown/rundown.service.js';
import { addTime, clearState, getState, load, pause, roll, start, update } from '../runtimeState.js';

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: vi.fn(() => ({
    setCustomFields: vi.fn((newData) => newData),
    setRundown: vi.fn((newData) => newData),
    getAutomation: vi.fn(() => ({
      enabledAutomations: false,
      enabledOscIn: false,
      oscPortIn: 0,
      triggers: [],
      automations: {},
    })),
  })),
}));

const first = makeOntimeEvent({
  id: 'first',
  timeStart: 0,
  timeEnd: 10 * MILLIS_PER_MINUTE,
  duration: 10 * MILLIS_PER_MINUTE,
}) as PlayableEvent;
const second = makeOntimeEvent({
  id: 'second',
  timeStart: 10 * MILLIS_PER_MINUTE,
  timeEnd: 20 * MILLIS_PER_MINUTE,
  duration: 10 * MILLIS_PER_MINUTE,
}) as PlayableEvent;

/** a command taken at a given offset from the start of the scenario */
type Command = { after: number; apply: (at: Instant) => void };

/**
 * Plays commands against a fresh runtime, as a server which receives each command late
 * and ticks on its own schedule would: each command runs `lateBy` after it was taken
 * but with the instant it was taken, and ticks fall at the given offsets
 * Returns the runtime state at the end of the scenario
 */
function replay(base: number, commands: Command[], lateBy: number, ticks: number[]) {
  vi.setSystemTime(base);
  clearState();
  const { rundown, metadata } = rundownCache.get();
  load(first, rundown, metadata);

  const timeline = [
    ...commands.map(({ after, apply }) => ({
      when: base + after + lateBy,
      run: () => apply((base + after) as Instant),
    })),
    ...ticks.map((after) => ({ when: base + after, run: () => update((base + after) as Instant) })),
  ].sort((a, b) => a.when - b.when);

  for (const { when, run } of timeline) {
    vi.setSystemTime(when);
    run();
  }

  const end = (base + 15 * MILLIS_PER_MINUTE) as Instant;
  vi.setSystemTime(end);
  update(end);
  return getState();
}

/** the same scenario on time, and late with ticks on a different schedule */
function expectSameState(base: number, commands: Command[]) {
  const onTime = replay(base, commands, 0, [2 * MILLIS_PER_MINUTE, 7 * MILLIS_PER_MINUTE]);
  const late = replay(base, commands, 250, [2 * MILLIS_PER_MINUTE + 13, 4 * MILLIS_PER_MINUTE + 500]);
  expect(late).toStrictEqual(onTime);
}

describe('runtime commands applied with the instant they were taken', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await initRundown(makeRundown({ entries: { first, second }, order: ['first', 'second'] }), {});
    vi.runAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test.each([
    ['during the day', new Date('jan 1 00:00').getTime()],
    ['across midnight', new Date('jan 1 23:58').getTime()],
  ])('start, pause and added time reach the same state when applied late, %s', (_label, base) => {
    expectSameState(base, [
      { after: MILLIS_PER_MINUTE, apply: (at) => start(undefined, at) },
      { after: 3 * MILLIS_PER_MINUTE, apply: (at) => pause(undefined, at) },
      { after: 5 * MILLIS_PER_MINUTE, apply: (at) => start(undefined, at) },
      { after: 6 * MILLIS_PER_MINUTE, apply: (at) => addTime(MILLIS_PER_MINUTE, at) },
    ]);
  });

  test('a forced finish keeps the instant it was taken', () => {
    expectSameState(new Date('jan 1 00:00').getTime(), [
      { after: MILLIS_PER_MINUTE, apply: (at) => start(undefined, at) },
      { after: 3 * MILLIS_PER_MINUTE, apply: (at) => addTime(-20 * MILLIS_PER_MINUTE, at) },
    ]);
  });

  test('roll reaches the same state when applied late', () => {
    expectSameState(new Date('jan 1 00:00').getTime(), [
      {
        after: 3 * MILLIS_PER_MINUTE + 30 * MILLIS_PER_SECOND,
        apply: (at) => {
          const { rundown, metadata } = rundownCache.get();
          roll(rundown, metadata, undefined, at);
        },
      },
    ]);
  });

  test.each([
    ['ahead of the end', -8],
    ['after the end', 7],
  ])('update reports the instant the timer reached its end when noticed %s', (_label, noticedAfterEnd) => {
    const base = new Date('jan 1 00:00').getTime();
    vi.setSystemTime(base);
    clearState();
    const { rundown, metadata } = rundownCache.get();
    load(first, rundown, metadata);
    start(undefined, base as Instant);

    const end = base + first.duration;
    const noticedAt = (end + noticedAfterEnd) as Instant;
    vi.setSystemTime(noticedAt);
    const { hasTimerFinished, finishedAt } = update(noticedAt);

    expect(hasTimerFinished).toBe(true);
    expect(finishedAt).toBe(end);
  });

  test('update reports a forced finish at the instant it was forced', () => {
    const base = new Date('jan 1 00:00').getTime();
    vi.setSystemTime(base);
    clearState();
    const { rundown, metadata } = rundownCache.get();
    load(first, rundown, metadata);
    start(undefined, base as Instant);
    addTime(-20 * MILLIS_PER_MINUTE, (base + MILLIS_PER_MINUTE) as Instant);

    const noticedAt = (base + MILLIS_PER_MINUTE + 25) as Instant;
    vi.setSystemTime(noticedAt);

    expect(update(noticedAt).finishedAt).toBe(base + MILLIS_PER_MINUTE);
  });
});
