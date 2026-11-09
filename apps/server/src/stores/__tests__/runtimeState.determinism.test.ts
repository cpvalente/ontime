import { Instant, PlayableEvent } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { makeOntimeEvent, makeRundown } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { rundownCache } from '../../api-data/rundown/rundown.dao.js';
import { initRundown } from '../../api-data/rundown/rundown.service.js';
import { addTime, clearState, getState, load, pause, roll, start, update } from '../runtimeState.js';

// the teleprompter follows rundown changes, which these tests do not look at
vi.mock('../../services/teleprompter-service/teleprompter.service.js');
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

const event = makeOntimeEvent({
  id: 'event',
  timeStart: 0,
  timeEnd: 10 * MILLIS_PER_MINUTE,
  duration: 10 * MILLIS_PER_MINUTE,
}) as PlayableEvent;

const base = new Date('jan 1 00:00').getTime();
const at = (offset: number) => (base + offset) as Instant;

function loadEvent() {
  vi.setSystemTime(base);
  clearState();
  const { rundown, metadata } = rundownCache.get();
  load(event, rundown, metadata);
}

describe('runtime driven by the instant things happened', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await initRundown(makeRundown({ entries: { [event.id]: event }, order: [event.id] }), {});
    vi.runAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('commands applied late with their instant reach the same state as on time', () => {
    const commands = (lateBy: number) => {
      loadEvent();
      vi.setSystemTime(at(MILLIS_PER_MINUTE + lateBy));
      start(undefined, at(MILLIS_PER_MINUTE));
      vi.setSystemTime(at(3 * MILLIS_PER_MINUTE + lateBy));
      pause(undefined, at(3 * MILLIS_PER_MINUTE));
      vi.setSystemTime(at(5 * MILLIS_PER_MINUTE + lateBy));
      start(undefined, at(5 * MILLIS_PER_MINUTE));
      addTime(MILLIS_PER_MINUTE, at(5 * MILLIS_PER_MINUTE));
      vi.setSystemTime(at(7 * MILLIS_PER_MINUTE));
      update(at(7 * MILLIS_PER_MINUTE));
      return getState();
    };

    const onTime = commands(0);
    expect(commands(250)).toStrictEqual(onTime);
  });

  test.each([
    ['ahead of time', -8],
    ['on a late tick', 7],
  ])('the end is placed at the instant the timer reached it when noticed %s', (_label, noticedAfterEnd) => {
    loadEvent();
    start(undefined, at(0));
    const noticedAt = at(event.duration + noticedAfterEnd);
    vi.setSystemTime(noticedAt);

    expect(update(noticedAt)).toMatchObject({ hasTimerFinished: true, finishedAt: at(event.duration) });
  });

  test('removing more time than remains ends the timer at the instant it was removed', () => {
    loadEvent();
    start(undefined, at(0));
    addTime(-20 * MILLIS_PER_MINUTE, at(MILLIS_PER_MINUTE));
    const noticedAt = at(MILLIS_PER_MINUTE + 25);
    vi.setSystemTime(noticedAt);

    expect(update(noticedAt).finishedAt).toBe(at(MILLIS_PER_MINUTE));
    expect(update(at(MILLIS_PER_MINUTE + 57)).hasTimerFinished).toBe(false);
  });

  test('a roll applied late with its instant reaches the same state as on time', () => {
    const rollAt = (lateBy: number) => {
      vi.setSystemTime(at(2 * MILLIS_PER_MINUTE + lateBy));
      clearState();
      const { rundown, metadata } = rundownCache.get();
      roll(rundown, metadata, undefined, at(2 * MILLIS_PER_MINUTE));
      return getState();
    };

    const onTime = rollAt(0);
    expect(rollAt(250)).toStrictEqual(onTime);
  });
});
